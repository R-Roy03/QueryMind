"""
Kaggle Olist Dataset Downloader
Downloads the Brazilian E-Commerce dataset and places CSVs in demo_data/kaggle/

Usage:
    pip install kagglehub
    python download_kaggle_data.py

OR manually download from:
    https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
    Extract CSVs to: demo_data/kaggle/
"""
import os
import shutil
from pathlib import Path

REQUIRED_FILES = [
    "olist_customers_dataset.csv",
    "olist_orders_dataset.csv",
    "olist_order_items_dataset.csv",
    "olist_order_payments_dataset.csv",
    "olist_order_reviews_dataset.csv",
    "olist_products_dataset.csv",
    "olist_sellers_dataset.csv",
]

TARGET_DIR = Path(__file__).parent / "demo_data" / "kaggle"


def download_with_kagglehub():
    """Download using kagglehub (requires pip install kagglehub)."""
    try:
        import kagglehub
        print("📦 Downloading Olist Brazilian E-Commerce dataset...")
        path = kagglehub.dataset_download("olistbr/brazilian-ecommerce")
        print(f"✅ Downloaded to: {path}")

        # Copy CSVs to target directory
        TARGET_DIR.mkdir(parents=True, exist_ok=True)
        source = Path(path)

        for csv_file in REQUIRED_FILES:
            src = source / csv_file
            if src.exists():
                shutil.copy2(src, TARGET_DIR / csv_file)
                size_mb = src.stat().st_size / (1024 * 1024)
                print(f"   ✅ {csv_file} ({size_mb:.1f} MB)")
            else:
                print(f"   ❌ {csv_file} NOT FOUND in download")

        print(f"\n🎉 All files copied to: {TARGET_DIR}")
        return True

    except ImportError:
        print("❌ kagglehub not installed. Run: pip install kagglehub")
        return False
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return False


def verify_files():
    """Check if all required CSVs exist."""
    print(f"\n🔍 Verifying files in: {TARGET_DIR}\n")
    all_ok = True
    for f in REQUIRED_FILES:
        path = TARGET_DIR / f
        if path.exists():
            size_mb = path.stat().st_size / (1024 * 1024)
            rows = sum(1 for _ in open(path, encoding="utf-8")) - 1
            print(f"   ✅ {f:45s} {size_mb:6.1f} MB   {rows:>8,} rows")
        else:
            print(f"   ❌ {f:45s} MISSING")
            all_ok = False

    if all_ok:
        print("\n✅ All files present! You can now run: docker-compose up --build")
    else:
        print("\n❌ Some files missing. Download from Kaggle and place in demo_data/kaggle/")
    return all_ok


if __name__ == "__main__":
    print("=" * 60)
    print("  QueryMind — Kaggle Olist Dataset Setup")
    print("=" * 60)

    if not TARGET_DIR.exists() or not any(TARGET_DIR.iterdir()):
        success = download_with_kagglehub()
        if not success:
            print("\n📋 Manual download instructions:")
            print("   1. Go to: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
            print("   2. Click 'Download' (needs Kaggle account)")
            print("   3. Extract ZIP contents")
            print(f"   4. Copy CSV files to: {TARGET_DIR}")
            print("   5. Re-run this script to verify")

    verify_files()
