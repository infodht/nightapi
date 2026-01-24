import logger from '../logger/logger.js';

const API_KEY = 'aeutsuADWEGuLtAUHzNvrw42963';

const address = async(req, res) => {
    const { postcode } = req.params;
  try {
    logger.info(`Address search requested for postcode: ${postcode}`);
    const response = await fetch(
      `https://api.getaddress.io/autocomplete/${postcode}?api-key=${API_KEY}`
    );
    const data = await response.json();
    logger.info(`Address suggestions fetched for postcode: ${postcode}`);
    res.json(data);
  } catch (err) {
    logger.error(`Failed to fetch address for postcode ${postcode}: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch address" });
  }
}

const getAddress = async(req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching full address for ID: ${id}`);
    const response = await fetch(
      `https://api.getaddress.io/get/${id}?api-key=${API_KEY}`
    );
    const data = await response.json();
    logger.info(`Address fetched successfully for ID: ${id}`);
    res.json(data);
  } catch (err) {
    logger.error(`Address fetch failed for ID ${id}: ${err.message}`);
    res.status(500).json({ error: "Address fetch failed" });
  }
}

export { address, getAddress }