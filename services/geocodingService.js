import axios from "axios";

export const getCoordinatesFromAddress = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "UrbanFixApp/1.0" }, // Nominatim requires a User-Agent
    });

    if (response.data.length > 0) {
      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
      };
    } else {
      console.error("⚠️ No coordinates found for:", address);
      return null;
    }
  } catch (err) {
    console.error("❌ Error fetching coordinates:", err.message);
    return null;
  }
};
