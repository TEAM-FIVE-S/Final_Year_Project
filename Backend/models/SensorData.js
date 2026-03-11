import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    heartrate: {
      type: Number,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    spo2: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SensorData = mongoose.model('SensorData', sensorDataSchema);

export default SensorData;