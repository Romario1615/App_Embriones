"""
Test Cloudinary API directly
"""
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from io import BytesIO
from PIL import Image

# Configure
cloudinary.config(
    cloud_name="dwnmf6niq",
    api_key="165586669561659",
    api_secret="w3K08BOp-z98EIdUbfCFwvMRbds",
    secure=True
)

# Create test image
print("Creating test image...")
img = Image.new('RGB', (400, 300), color='blue')
img_bytes = BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

try:
    print("Uploading to Cloudinary...")
    upload_result = cloudinary.uploader.upload(
        img_bytes.read(),
        public_id="test/test_image",
        folder="test",
        resource_type="image",
        transformation=[
            {"quality": "auto", "fetch_format": "auto"}
        ]
    )

    print(f"[OK] Upload successful!")
    print(f"  - Public ID: {upload_result['public_id']}")
    print(f"  - URL: {upload_result['secure_url']}")

    # Generate thumbnail URL
    print("\nGenerating thumbnail URL...")
    thumbnail_url, _ = cloudinary.utils.cloudinary_url(
        upload_result['public_id'],
        width=300,
        height=300,
        crop="fill",
        quality="auto",
        fetch_format="auto"
    )

    print(f"[OK] Thumbnail URL generated: {thumbnail_url}")

    # Clean up
    print("\nCleaning up...")
    cloudinary.uploader.destroy(upload_result['public_id'])
    print("[OK] Test image deleted from Cloudinary")

    print("\n" + "="*60)
    print("[OK] ALL TESTS PASSED - Cloudinary is working correctly!")
    print("="*60)

except Exception as e:
    print(f"[ERROR] {str(e)}")
    import traceback
    traceback.print_exc()
