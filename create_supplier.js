// create_supplier.js
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

const newSupplierData = {
  supplier_name: 'Default Supplier',
  contact_person: 'John Doe',
  contact_email: 'john.doe@default.com'
};

const adminCredentials = {
  user_name: 'test_admin',
  password: 'password123'
};

const createSupplier = async () => {
  try {
    // 1. Login as admin to get the token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/users/login`, adminCredentials);
    const token = loginResponse.data.token;
    console.log('Login successful. Token received.');

    if (!token) {
      throw new Error('Authentication failed, no token received.');
    }

    // 2. Use the token to create a new supplier
    console.log('Creating a new supplier...');
    const createResponse = await axios.post(`${API_BASE_URL}/supplier`, newSupplierData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (createResponse.status === 201) {
      console.log('Supplier created successfully!', createResponse.data);
    } else {
      console.error('Failed to create supplier. Status:', createResponse.status);
      console.error('Response:', createResponse.data);
    }
  } catch (error) {
    console.error('An error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
};

createSupplier(); 