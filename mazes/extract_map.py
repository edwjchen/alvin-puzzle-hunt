import cv2
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt


def remove_text_blocks(image, text_keywords=None):
    """
    Remove text blocks from the image by detecting and filling rectangular text regions.

    Args:
        image (numpy.ndarray): Input binary image
        text_keywords (list): List of text keywords to look for (optional)

    Returns:
        numpy.ndarray: Image with text blocks removed
    """
    if text_keywords is None:
        text_keywords = ["sandstorm", "undergrowth", "maze"]

    # Find contours to identify potential text regions
    contours, _ = cv2.findContours(
        image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    result_img = image.copy()

    for contour in contours:
        # Get bounding rectangle
        x, y, w, h = cv2.boundingRect(contour)

        # Check if this might be a text region based on aspect ratio and size
        aspect_ratio = w / h
        area = cv2.contourArea(contour)

        # Text regions typically have specific characteristics:
        # - Width > height (horizontal text)
        # - Reasonable size (not too small or too large)
        # - Could be rectangular regions

        if (aspect_ratio > 1.5 and area > 500 and area < 50000) or \
           (aspect_ratio < 0.7 and area > 500 and area < 50000):

            # This looks like a text block, fill it with black
            cv2.rectangle(result_img, (x, y), (x + w, y + h), 0, -1)

    return result_img


def extract_white_outline(image_path, output_path=None, threshold=200, remove_text=True, left_only=True):
    """
    Extract white outline from a map image with optional text removal.

    Args:
        image_path (str): Path to the input image
        output_path (str): Path to save the output image (optional)
        threshold (int): Threshold for white pixel detection (0-255)
        remove_text (bool): Whether to remove text blocks from the image
        left_only (bool): Whether to keep only the left half of the image

    Returns:
        numpy.ndarray: Binary image with white outline
    """

    # Load the image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")

    # Convert BGR to RGB for proper color handling
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Convert to grayscale
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)

    # Crop to left half if requested
    if left_only:
        height, width = gray.shape
        left_half_width = width // 2
        gray = gray[:, :left_half_width]

    # For maze 1 and 4, use edge detection to find only the maze lines
    if "maze_1" in image_path or "maze_4" in image_path:
        # Standard edge detection for maze 1 and 4
        edges = cv2.Canny(gray, 50, 150)

        # Dilate the edges slightly to make them more visible
        kernel = np.ones((2, 2), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=1)

        # Convert to white lines on black background
        outline_img = edges.copy()

        # Apply final morphological operations to clean up
        kernel = np.ones((2, 2), np.uint8)
        outline_img = cv2.morphologyEx(outline_img, cv2.MORPH_CLOSE, kernel)

    else:
        # Original method for other mazes
        # Create binary mask for white pixels
        white_mask = gray > threshold

        # Alternative method: Look for pixels that are close to white in RGB
        white_pixels = np.all(
            img_rgb > [threshold, threshold, threshold], axis=2)

        # Combine both methods
        final_mask = white_mask | white_pixels

        # Create output image (white outline on black background)
        outline_img = np.zeros_like(gray)
        outline_img[final_mask] = 255

        # Clean up the image with morphological operations
        kernel = np.ones((2, 2), np.uint8)
        outline_img = cv2.morphologyEx(outline_img, cv2.MORPH_CLOSE, kernel)
        outline_img = cv2.morphologyEx(outline_img, cv2.MORPH_OPEN, kernel)

    # Remove text blocks if requested
    if remove_text:
        outline_img = remove_text_blocks(outline_img)

    # Save the result if output path is provided
    if output_path:
        cv2.imwrite(output_path, outline_img)
        print(f"Outline saved to: {output_path}")

    return outline_img


def extract_outline_advanced(image_path, output_path=None):
    """
    Advanced method using edge detection and contour finding.

    Args:
        image_path (str): Path to the input image
        output_path (str): Path to save the output image (optional)

    Returns:
        numpy.ndarray: Binary image with refined outline
    """

    # Load image
    img = cv2.imread(image_path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)

    # First get white pixels
    white_mask = gray > 200
    white_img = np.zeros_like(gray)
    white_img[white_mask] = 255

    # Find contours of white regions
    contours, _ = cv2.findContours(
        white_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Create outline image
    outline_img = np.zeros_like(gray)

    # Draw contours (outlines only)
    cv2.drawContours(outline_img, contours, -1, 255, 2)

    # Save the result if output path is provided
    if output_path:
        cv2.imwrite(output_path, outline_img)
        print(f"Advanced outline saved to: {output_path}")

    return outline_img


def visualize_results(original_path, simple_outline, advanced_outline):
    """
    Display original image alongside extracted outlines.
    """

    # Load original image
    original = Image.open(original_path)

    # Create subplot
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    # Original image
    axes[0].imshow(original)
    axes[0].set_title('Original Image')
    axes[0].axis('off')

    # Simple outline
    axes[1].imshow(simple_outline, cmap='gray')
    axes[1].set_title('Simple White Extraction')
    axes[1].axis('off')

    # Advanced outline
    axes[2].imshow(advanced_outline, cmap='gray')
    axes[2].set_title('Advanced Contour Outline')
    axes[2].axis('off')

    plt.tight_layout()
    plt.show()


# Example usage
if __name__ == "__main__":
    # Replace with your image path
    input_image = "undergrowth_map.png"  # Change this to your image path

    try:
        # Method 1: Simple white pixel extraction
        simple_outline = extract_white_outline(
            input_image,
            output_path="map_outline_simple.png",
            threshold=200
        )

        # Method 2: Advanced contour-based extraction
        advanced_outline = extract_outline_advanced(
            input_image,
            output_path="map_outline_advanced.png"
        )

        # Visualize results
        visualize_results(input_image, simple_outline, advanced_outline)

        print("Successfully extracted map outlines!")
        print("- Simple method: map_outline_simple.png")
        print("- Advanced method: map_outline_advanced.png")

    except Exception as e:
        print(f"Error: {e}")
        print("Make sure to install required packages: pip install opencv-python pillow matplotlib")
        print("And update the input_image path to point to your map image.")
