
const API_KEY = 'aeutsuADWEGuLtAUHzNvrw42963';

const address = async(req, res) => {
    const { postcode } = req.params;
  try {
    const response = await fetch(
      `https://api.getaddress.io/autocomplete/${postcode}?api-key=${API_KEY}`
    );
    const data = await response.json();
    // console.log(data)
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch address" });
  }
}

const getAddress = async(req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(
      `https://api.getaddress.io/get/${id}?api-key=${API_KEY}`
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Address fetch failed" });
  }
}

export { address, getAddress }