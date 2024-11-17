import axios from 'axios';

/**
 * Get recommended products based on the provided product name.
 * @param {string} productName - The name of the product to get recommendations for.
 * @returns {Promise<Array>} - A promise that resolves to an array of recommended products.
 */
export const getRecommendedProducts = async (productName, userID) => {
  try {
    const response = await axios.post('http://127.0.0.1:5000/recommend', {
      clicked_product: productName,
    });

    // Assuming the response data contains a list of recommended products
    return response.data; // Adjust based on the actual response structure
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    throw new Error('Could not fetch recommendations.'); // Handle error appropriately
  }
}; 