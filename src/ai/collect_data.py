import os
import requests
from bs4 import BeautifulSoup
import time
import random
from PIL import Image
from io import BytesIO
import urllib.parse
import logging
from concurrent.futures import ThreadPoolExecutor
import json

class MedicineImageCollector:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.setup_logging()
        
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('data_collection.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def create_directories(self):
        """Create necessary directories for storing images"""
        directories = [
            'dataset/train/machine_packed',
            'dataset/train/hand_packed',
            'dataset/validation/machine_packed',
            'dataset/validation/hand_packed'
        ]
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            self.logger.info(f"Created directory: {directory}")

    def search_google_images(self, query, num_images=100):
        """Search Google Images for medicine packaging images"""
        base_url = "https://www.google.com/search"
        params = {
            'q': query,
            'tbm': 'isch',
            'tbs': 'itp:photo'
        }
        
        try:
            response = requests.get(base_url, params=params, headers=self.headers)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract image URLs
            image_urls = []
            for img in soup.find_all('img'):
                if img.get('src') and img['src'].startswith('http'):
                    image_urls.append(img['src'])
            
            return image_urls[:num_images]
        except Exception as e:
            self.logger.error(f"Error searching Google Images: {str(e)}")
            return []

    def download_image(self, url, save_path):
        """Download and save an image"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                # Verify it's an image
                img = Image.open(BytesIO(response.content))
                img.verify()
                
                # Save the image
                with open(save_path, 'wb') as f:
                    f.write(response.content)
                return True
        except Exception as e:
            self.logger.error(f"Error downloading image {url}: {str(e)}")
        return False

    def process_image(self, image_path):
        """Process and validate downloaded image"""
        try:
            img = Image.open(image_path)
            
            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to standard size
            img = img.resize((224, 224))
            
            # Save processed image
            img.save(image_path, 'JPEG')
            return True
        except Exception as e:
            self.logger.error(f"Error processing image {image_path}: {str(e)}")
            if os.path.exists(image_path):
                os.remove(image_path)
            return False

    def collect_data(self, num_images_per_class=500):
        """Collect and process images for both classes"""
        self.create_directories()
        
        # Search queries for each class
        queries = {
            'machine_packed': [
                'pharmaceutical packaging machine',
                'automated medicine packaging',
                'industrial medicine packaging',
                'pharma packaging line',
                'automated pill packaging'
            ],
            'hand_packed': [
                'hand packed medicine',
                'manual medicine packaging',
                'traditional medicine packaging',
                'hand filled medicine bottles',
                'manual pill packaging'
            ]
        }
        
        for packaging_type, search_queries in queries.items():
            self.logger.info(f"Collecting {packaging_type} images...")
            
            # Calculate images per query
            images_per_query = num_images_per_class // len(search_queries)
            
            for query in search_queries:
                self.logger.info(f"Searching for: {query}")
                image_urls = self.search_google_images(query, images_per_query)
                
                # Download images using thread pool
                with ThreadPoolExecutor(max_workers=5) as executor:
                    for i, url in enumerate(image_urls):
                        # Determine if image goes to train or validation
                        is_train = random.random() < 0.8  # 80% for training
                        subdir = 'train' if is_train else 'validation'
                        
                        save_path = f'dataset/{subdir}/{packaging_type}/image_{int(time.time())}_{i}.jpg'
                        
                        # Download and process image
                        if self.download_image(url, save_path):
                            if self.process_image(save_path):
                                self.logger.info(f"Successfully processed: {save_path}")
                            else:
                                if os.path.exists(save_path):
                                    os.remove(save_path)
                        
                        # Be nice to the servers
                        time.sleep(random.uniform(1, 3))
        
        self.logger.info("Data collection completed!")

    def verify_dataset(self):
        """Verify the collected dataset"""
        stats = {
            'train': {'machine_packed': 0, 'hand_packed': 0},
            'validation': {'machine_packed': 0, 'hand_packed': 0}
        }
        
        for split in ['train', 'validation']:
            for packaging_type in ['machine_packed', 'hand_packed']:
                path = f'dataset/{split}/{packaging_type}'
                if os.path.exists(path):
                    stats[split][packaging_type] = len(os.listdir(path))
        
        self.logger.info("Dataset Statistics:")
        self.logger.info(json.dumps(stats, indent=2))
        return stats

if __name__ == "__main__":
    collector = MedicineImageCollector()
    collector.collect_data(num_images_per_class=500)
    collector.verify_dataset() 