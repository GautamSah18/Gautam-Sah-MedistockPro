import api from './api';

// Bonus Schemes API Service

// Get all active bonuses
export const getActiveBonuses = async () => {
  try {
    const response = await api.get('/api/bonus-schemes/bonuses/active/');
    return response.data;
  } catch (error) {
    console.error('Error fetching active bonuses:', error);
    throw error;
  }
};

// Get all bill schemes
export const getBillSchemes = async () => {
  try {
    const response = await api.get('/api/bonus-schemes/bill-schemes/');
    return response.data;
  } catch (error) {
    console.error('Error fetching bill schemes:', error);
    throw error;
  }
};

// Check eligibility for schemes based on cart total
export const checkSchemeEligibility = async (cartTotal) => {
  try {
    const response = await api.post('/api/bonus-schemes/bill-schemes/check_eligibility/', {
      cart_total: cartTotal
    });
    return response.data;
  } catch (error) {
    console.error('Error checking scheme eligibility:', error);
    throw error;
  }
};

// Apply a scheme to a bill
export const applySchemeToBill = async (billId, schemeId, selectedGiftIds) => {
  try {
    const response = await api.post('/api/bonus-schemes/bill-schemes/apply_scheme/', {
      bill_id: billId,
      scheme_id: schemeId,
      selected_gift_ids: selectedGiftIds
    });
    return response.data;
  } catch (error) {
    console.error('Error applying scheme:', error);
    throw error;
  }
};

// Get applied bonuses for a bill
export const getAppliedBonuses = async (billId) => {
  try {
    const response = await api.get(`/api/bonus-schemes/applied-bonuses/?bill=${billId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching applied bonuses:', error);
    throw error;
  }
};

// Get applied schemes for a bill
export const getAppliedSchemes = async (billId) => {
  try {
    const response = await api.get(`/api/bonus-schemes/applied-schemes/?bill=${billId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching applied schemes:', error);
    throw error;
  }
};

// Get all gifts
export const getAllGifts = async () => {
  try {
    const response = await api.get('/api/bonus-schemes/gifts/');
    return response.data;
  } catch (error) {
    console.error('Error fetching gifts:', error);
    throw error;
  }
};

export default {
  getActiveBonuses,
  getBillSchemes,
  checkSchemeEligibility,
  applySchemeToBill,
  getAppliedBonuses,
  getAppliedSchemes,
  getAllGifts
};
