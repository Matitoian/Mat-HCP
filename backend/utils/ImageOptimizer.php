<?php
/**
 * Image Optimization Service
 * Handles WebP conversion, compression, and lazy loading
 * For 2.5M concurrent users - critical for bandwidth reduction
 */

class ImageOptimizer
{
    private $imagickAvailable;
    private $imagemagickPath;
    private $outputDir;
    private $qualityThreshold = 75;
    
    public function __construct($outputDir = '/tmp/images')
    {
        $this->imagickAvailable = extension_loaded('imagick');
        $this->imagemagickPath = shell_exec('which convert') ?: null;
        $this->outputDir = $outputDir;
        
        if (!is_dir($this->outputDir)) {
            mkdir($this->outputDir, 0755, true);
        }
    }

    /**
     * Optimize property image to multiple formats
     * Returns URLs for original, WebP, and thumbnail
     */
    public function optimizePropertyImage($imagePath, $propertyId)
    {
        try {
            $filename = basename($imagePath);
            $nameWithoutExt = pathinfo($filename, PATHINFO_FILENAME);
            
            $results = [
                'original' => null,
                'webp' => null,
                'thumbnail' => null,
                'lowQuality' => null,
                'size' => filesize($imagePath),
                'compressed' => false
            ];

            // Original compressed
            if ($this->imagickAvailable) {
                $results['original'] = $this->compressWithImageMagick(
                    $imagePath,
                    $nameWithoutExt . '.jpg',
                    ['quality' => 80, 'width' => 1200]
                );

                // WebP format
                $results['webp'] = $this->convertToWebP(
                    $imagePath,
                    $nameWithoutExt . '.webp',
                    ['quality' => 80, 'width' => 1200]
                );

                // Thumbnail (400x300)
                $results['thumbnail'] = $this->compressWithImageMagick(
                    $imagePath,
                    $nameWithoutExt . '_thumb.jpg',
                    ['quality' => 75, 'width' => 400, 'height' => 300]
                );

                // Low quality placeholder
                $results['lowQuality'] = $this->compressWithImageMagick(
                    $imagePath,
                    $nameWithoutExt . '_lq.jpg',
                    ['quality' => 30, 'width' => 100, 'height' => 75]
                );

                $results['compressed'] = true;
            }

            return $results;

        } catch (Exception $e) {
            error_log("Image optimization failed: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Compress image using ImageMagick
     */
    private function compressWithImageMagick($source, $filename, $options = [])
    {
        if (!$this->imagemagickPath) {
            return null;
        }

        $output = $this->outputDir . '/' . $filename;
        $quality = $options['quality'] ?? 80;
        $width = $options['width'] ?? null;
        $height = $options['height'] ?? null;

        $cmd = "convert '$source' -quality {$quality}";
        
        if ($width && $height) {
            $cmd .= " -resize {$width}x{$height}^";
            $cmd .= " -gravity center -extent {$width}x{$height}";
        } elseif ($width) {
            $cmd .= " -resize {$width}";
        }

        $cmd .= " -strip '$output'";

        $output_var = null;
        $return_var = null;
        exec($cmd, $output_var, $return_var);

        if ($return_var === 0) {
            return '/images/optimized/' . $filename;
        }

        return null;
    }

    /**
     * Convert to WebP format
     */
    private function convertToWebP($source, $filename, $options = [])
    {
        if (!$this->imagemagickPath) {
            return null;
        }

        $output = $this->outputDir . '/' . $filename;
        $quality = $options['quality'] ?? 80;
        $width = $options['width'] ?? null;

        $cmd = "convert '$source' -quality {$quality}";
        
        if ($width) {
            $cmd .= " -resize {$width}";
        }

        $cmd .= " -strip '$output'";

        $output_var = null;
        $return_var = null;
        exec($cmd, $output_var, $return_var);

        if ($return_var === 0) {
            return '/images/optimized/' . $filename;
        }

        return null;
    }

    /**
     * Batch optimize multiple images
     * For property bulk uploads
     */
    public function batchOptimize($imageArray, $propertyId)
    {
        $results = [];
        
        foreach ($imageArray as $index => $imagePath) {
            $results[$index] = $this->optimizePropertyImage($imagePath, $propertyId);
        }

        return $results;
    }

    /**
     * Generate srcset for responsive images
     */
    public function generateSrcSet($imageUrl, $sizes = [640, 1024, 1280])
    {
        $srcset = [];
        
        foreach ($sizes as $size) {
            $key = str_replace('.', "__{$size}.", $imageUrl);
            $srcset[] = "{$key} {$size}w";
        }

        return implode(', ', $srcset);
    }

    /**
     * Generate lazy load HTML
     */
    public function generateLazyLoadHTML($imageUrl, $alt = '')
    {
        $lowQualityUrl = str_replace('.', '_lq.', $imageUrl);
        $webpUrl = str_replace('.jpg', '.webp', $imageUrl);

        return <<<HTML
<picture>
    <source srcset="{$webpUrl}" type="image/webp">
    <img 
        src="{$lowQualityUrl}"
        data-src="{$imageUrl}"
        alt="{$alt}"
        class="lazy-load"
        loading="lazy"
    />
</picture>
HTML;
    }

    /**
     * Get optimization statistics
     */
    public function getOptimizationStats($originalSize, $compressedSize)
    {
        $saved = $originalSize - $compressedSize;
        $percentage = ($saved / $originalSize) * 100;

        return [
            'original' => $originalSize,
            'compressed' => $compressedSize,
            'saved' => $saved,
            'percentage' => round($percentage, 2)
        ];
    }
}

// Lazy loading JavaScript to add to frontend
$lazyLoadScript = <<<JS
<script>
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img.lazy-load');
    
    // Using Intersection Observer for better performance
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy-load');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px'
    });
    
    images.forEach(img => imageObserver.observe(img));
});
</script>
JS;
