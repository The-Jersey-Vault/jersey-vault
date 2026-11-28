import { checkDelhiveryPincode, calculateDelhiveryRate, calculateLiveDeliveryRate } from '../services/delhivery.service.js';

/**
 * Controller to handle shipping calculation & pincode checks.
 * Uses Prepaid ₹99 / COD ₹149 delivery charges (₹0 if cart subtotal > ₹1099).
 */

export async function calculateRate(req, res) {
  try {
    const { pincode, paymentMode = 'PREPAID', subtotal = 0 } = req.body;

    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit destination pincode is required.'
      });
    }

    const rateResult = await calculateDelhiveryRate({
      destinationPincode: pincode,
      paymentMode,
      subtotal: Number(subtotal) || 0
    });

    return res.status(200).json({
      success: true,
      data: rateResult
    });
  } catch (error) {
    console.error('Error in calculateRate controller:', error);
    const subtotalNum = Number(req.body?.subtotal) || 0;
    const isCod = String(req.body?.paymentMode).toUpperCase() === 'COD';
    const fallbackFee = subtotalNum > 1099 ? 0 : (isCod ? 149 : 99);
    return res.status(200).json({
      success: true,
      data: {
        serviceable: true,
        shippingFee: fallbackFee,
        totalShipping: fallbackFee,
        delivery_fee: fallbackFee,
        freeShippingApplied: subtotalNum > 1099,
        estimatedDays: '3-5 Business Days',
        remarks: subtotalNum > 1099 ? 'Free Shipping Applied 🎉' : (isCod ? 'Standard COD Shipping Charge ₹149' : 'Standard Delivery Charge ₹99')
      }
    });
  }
}

export async function calculateLiveRateController(req, res) {
  const rawMode = req.body?.payment_mode || req.body?.paymentMode;
  const paymentMode = String(rawMode || 'PREPAID').trim().toUpperCase() === 'COD' ? 'COD' : 'PREPAID';
  const subtotalNum = Math.max(0, Number(req.body?.subtotal) || 0);

  try {
    const {
      origin_pincode,
      destination_pincode,
    } = req.body;

    const destPin = destination_pincode || req.body?.pincode;

    if (!destPin || !/^\d{6}$/.test(String(destPin).trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit destination pincode is required.'
      });
    }

    const rateResult = await calculateLiveDeliveryRate({
      origin_pincode,
      destination_pincode: destPin,
      payment_mode: paymentMode,
      subtotal: subtotalNum
    });

    return res.status(200).json({
      success: true,
      data: rateResult
    });
  } catch (error) {
    console.error('Error in calculateLiveRateController:', error);
    // When live rate lookup fails, return an honest service status without claiming unverified delivery
    return res.status(503).json({
      success: false,
      message: 'Unable to calculate live shipping rate at this time. Please try again or proceed with standard checkout.',
      data: {
        serviceable: false,
        payment_mode: paymentMode,
        error_type: 'CARRIER_UNAVAILABLE'
      }
    });
  }
}

export async function checkPincode(req, res) {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid 6-digit pincode is required.'
      });
    }

    const result = await checkDelhiveryPincode(pincode);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in checkPincode controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check pincode serviceability.'
    });
  }
}
