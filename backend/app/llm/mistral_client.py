"""
Mistral AI client wrapper.
Handles all communication with the Mistral API.
Three methods: chat (text), chat_json (parsed), chat_stream (streaming).
"""
from mistralai import Mistral
from app.config import settings
import json
import re
import time
import logging

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> dict:
    """
    Robustly extract JSON from LLM output that may contain
    markdown fences, preamble text, or trailing commentary.
    """
    # 1) Strip markdown code fences (```json ... ``` or ``` ... ```)
    fence_pattern = r"```(?:json)?\s*\n?(.*?)```"
    match = re.search(fence_pattern, text, re.DOTALL)
    if match:
        text = match.group(1).strip()

    # 2) Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 3) Find the first { ... } or [ ... ] block using brace matching
    start = None
    open_char = None
    close_char = None
    for i, ch in enumerate(text):
        if ch in ('{', '['):
            start = i
            open_char = ch
            close_char = '}' if ch == '{' else ']'
            break

    if start is not None:
        depth = 0
        in_string = False
        escape = False
        for i in range(start, len(text)):
            ch = text[i]
            if escape:
                escape = False
                continue
            if ch == '\\' and in_string:
                escape = True
                continue
            if ch == '"' and not escape:
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == open_char:
                depth += 1
            elif ch == close_char:
                depth -= 1
                if depth == 0:
                    candidate = text[start:i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break

    # 4) Last resort — raise with context
    raise ValueError(f"LLM returned invalid JSON")


class MistralClient:
    def __init__(self):
        self.client = Mistral(api_key=settings.mistral_api_key)
        self.model = settings.mistral_model

    def _call_with_retry(self, **kwargs):
        """Call Mistral API with retry on rate-limit (429) errors."""
        max_retries = 3
        for attempt in range(max_retries + 1):
            try:
                return self.client.chat.complete(**kwargs)
            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "rate_limit" in error_str.lower()
                if is_rate_limit and attempt < max_retries:
                    wait = 2 ** (attempt + 1)  # 2s, 4s, 8s
                    logger.warning(f"Rate limited, retrying in {wait}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait)
                    continue
                logger.error(f"Mistral API error: {e}")
                raise

    def chat(self, prompt: str, system: str = None) -> str:
        """Send a prompt, get back text response."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = self._call_with_retry(
            model=self.model,
            messages=messages,
            max_tokens=2048,
            temperature=0.1,
        )
        return response.choices[0].message.content.strip()

    def chat_json(self, prompt: str, system: str = None) -> dict:
        """Send a prompt, parse response as JSON.
        Uses Mistral's native JSON mode first, falls back to robust extraction.
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            # Use Mistral's native JSON response format
            response = self._call_with_retry(
                model=self.model,
                messages=messages,
                max_tokens=2048,
                temperature=0.1,
                response_format={"type": "json_object"},
            )
            text = response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"JSON mode call failed, retrying without: {e}")
            # Fallback: call without response_format
            text = self.chat(prompt, system)

        try:
            return _extract_json(text)
        except (json.JSONDecodeError, ValueError):
            logger.error(f"Failed to parse JSON. Raw output:\n{text[:1000]}")
            raise ValueError("LLM returned invalid JSON")

    def chat_messages(self, messages: list) -> str:
        """Send a full conversation history, get back text response.
        Used by the agent loop to maintain context across iterations.
        """
        response = self._call_with_retry(
            model=self.model,
            messages=messages,
            max_tokens=2048,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()

    def chat_stream(self, messages: list):
        """Stream responses for agent chat."""
        return self.client.chat.stream(
            model=self.model,
            messages=messages,
            max_tokens=2048,
            temperature=0.2,
        )


# Singleton instance — import this everywhere
llm = MistralClient()
