const express = require("express");
const ModbusRTU = require("modbus-serial");
const cors = require("cors");

const app = express();
app.use(cors());

// Configure the Modbus client
const client = new ModbusRTU();
const host = "192.168.1.232";
const port = 10000;

// Connect to the Modbus server
async function connectClient() {
  try {
    await client.connectTCP(host, { port });
    client.setID(1); // Set the Modbus unit ID
    console.log("Connected to Modbus server");
  } catch (error) {
    console.error("Error connecting to Modbus server:", error.message);
  }
}

connectClient();

// Endpoint to turn all relays on
app.get("/rely-all-on", async (req, res) => {
  try {
    const startAddress = 0;
    const data = Array(16).fill(true); // Turn all relays ON

    await client.writeCoils(startAddress, data);

    res.json({ status: "success", message: "All relays turned ON." });
  } catch (error) {
    console.error("Error writing coils:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Endpoint to turn all relays off
app.get("/rely-all-off", async (req, res) => {
  try {
    const startAddress = 0;
    const data = Array(16).fill(false); // Turn all relays OFF

    await client.writeCoils(startAddress, data);

    res.json({ status: "success", message: "All relays turned OFF." });
  } catch (error) {
    console.error("Error writing coils:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Dynamic GET endpoints for specific relay actions (e.g., /rely-1-on, /rely-1-off)
app.get("/rely-:id-:action", async (req, res) => {
  try {
    const { id, action } = req.params;

    // Validate relay number
    const relayNumber = parseInt(id, 10);
    if (isNaN(relayNumber) ||  relayNumber < 1 ||  relayNumber > 16) {
      return res.status(400).json({ status: "error", message: "Invalid relay number. Must be between 1 and 16." });
    }

    // Determine state
    const state = action === "on";

    if (action !== "on" && action !== "off") {
      return res.status(400).json({ status: "error", message: "Invalid action. Use 'on' or 'off'." });
    }

    const startAddress = relayNumber - 1; // 0-based index for Modbus
    await client.writeCoil(startAddress, state);

    res.json({
      status: "success",
      message: `Relay ${relayNumber} turned ${state ? "on" : "off"}.`,
    });
  } catch (error) {
    console.error("Error controlling relay:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});