import express from 'express';
import { clinicalController } from '../controllers/clinicalController.js';

const router = express.Router();

router.get('/therapist', clinicalController.getTherapist);
router.get('/requests', clinicalController.getRequests);
router.post('/book', clinicalController.submitBooking);
router.patch('/requests/:id', clinicalController.updateRequestStatus);

export default router;
