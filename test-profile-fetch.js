// Quick test to check if profile API is working
const axios = require('axios');

const API_BASE = 'https://h5k4oat3hi.execute-api.us-east-1.amazonaws.com';

async function testProfileAPI() {
    try {
        console.log('Testing profile API endpoint...');

        // Test with a mock token
        const response = await axios.get(`${API_BASE}/profile`, {
            headers: {
                'Authorization': 'Bearer mock-token',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('✅ Profile API is reachable');
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.log('📡 API responded with status:', error.response.status);
            console.log('📡 Response data:', JSON.stringify(error.response.data, null, 2));

            if (error.response.status === 401) {
                console.log('✅ API is working - 401 is expected without valid auth token');
            } else if (error.response.status === 404) {
                console.log('✅ API is working - 404 means profile doesn\'t exist for this user');
            }
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            console.log('❌ Cannot connect to API - network issue');
            console.log('Error:', error.message);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

testProfileAPI();
