const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const secondaryUri = process.env.MONGODB_URI_STD;
  const mongoUri = primaryUri || secondaryUri;
  const uriSource = primaryUri ? 'MONGODB_URI/MONGO_URI' : (secondaryUri ? 'MONGODB_URI_STD' : 'none');

  try {
    if (!mongoUri) {
      throw new Error('MongoDB connection string is missing. Set MONGODB_URI, MONGODB_URI_STD, or MONGO_URI in your environment.');
    }

    console.log(`🔌 Attempting MongoDB connection using ${uriSource}`);

    const connectOptions = (uri) => ({
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      tls: uri.includes('.mongodb.net'),
    });

    let conn;
    try {
      conn = await mongoose.connect(mongoUri, connectOptions(mongoUri));
    } catch (error) {
      const isSrvLookupError = error.name === 'MongoServerSelectionError' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || (error.message && error.message.includes('querySrv'));
      if (primaryUri && primaryUri.startsWith('mongodb+srv://') && secondaryUri && isSrvLookupError) {
        console.warn('⚠️ MongoDB SRV lookup failed; retrying with MONGODB_URI_STD.');
        conn = await mongoose.connect(secondaryUri, connectOptions(secondaryUri));
      } else {
        throw error;
      }
    }


    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    const isAtlas = mongoUri && mongoUri.includes('.mongodb.net');
    if (error.name === 'MongoServerSelectionError' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || (error.message && error.message.includes('querySrv'))) {
      console.error('👉 If you are using MongoDB Atlas, try the following:');
      console.error('   1) In Atlas -> Network Access, add your current IP address (or 0.0.0.0/0 for testing).');
      console.error('   2) If DNS SRV (mongodb+srv) lookup fails, set MONGODB_URI_STD to your Atlas standard (non-SRV) connection string.');
      console.error('   3) Ensure outbound DNS/port 53 and TLS are allowed from this machine/network.');
      if (isAtlas) {
        console.error('   Example (replace with your hosts/replicaSet from Atlas):');
        console.error("   mongodb://<username>:<password>@host1:27017,host2:27017/<dbname>?replicaSet=rs0&authSource=admin&tls=true");
      }
    }
    console.error('For Atlas connection docs see: https://www.mongodb.com/docs/atlas/');
    console.warn('⚠️ Continuing without MongoDB for now. Auth and file routes may fail until the connection is fixed.');
  }
};

module.exports = connectDB;