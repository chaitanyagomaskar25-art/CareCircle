import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointments,
  getAppointmentById,
  addQuestionToAppointment,
  getPreparationSummary,
  checkUpcomingAppointmentReminders,
} from '../services/appointment.service.js';

/**
 * Controller: Create new appointment.
 * Route: POST /api/v1/appointments
 */
export const create = asyncHandler(async (req, res) => {
  const appointment = await createAppointment({
    ...req.body,
    requester: req.user,
    ipAddress: req.ip,
  });

  return ApiResponse.created(res, appointment, 'Doctor appointment scheduled successfully.');
});

/**
 * Controller: Get appointments with filters.
 * Route: GET /api/v1/appointments
 */
export const getAll = asyncHandler(async (req, res) => {
  const { elderlyUserId, status = 'all', startDate, endDate } = req.query;

  // If elderly user is querying their own appointments
  const resolvedElderlyId = elderlyUserId || (req.user.role === 'elderly' ? req.user._id : null);

  const appointments = await getAppointments({
    elderlyUserId: resolvedElderlyId,
    status,
    startDate,
    endDate,
    requester: req.user,
  });

  return ApiResponse.success(res, 200, 'Appointments retrieved successfully.', appointments);
});

/**
 * Controller: Get single appointment details.
 * Route: GET /api/v1/appointments/:id
 */
export const getById = asyncHandler(async (req, res) => {
  const appointment = await getAppointmentById({
    id: req.params.id,
    requester: req.user,
  });

  return ApiResponse.success(res, 200, 'Appointment details retrieved successfully.', appointment);
});

/**
 * Controller: Update appointment.
 * Route: PUT /api/v1/appointments/:id
 */
export const update = asyncHandler(async (req, res) => {
  const appointment = await updateAppointment({
    id: req.params.id,
    updates: req.body,
    requester: req.user,
    ipAddress: req.ip,
  });

  return ApiResponse.success(res, 200, 'Appointment updated successfully.', appointment);
});

/**
 * Controller: Cancel appointment.
 * Route: DELETE /api/v1/appointments/:id or PATCH /api/v1/appointments/:id/cancel
 */
export const cancel = asyncHandler(async (req, res) => {
  const { reason = '' } = req.body;
  const appointment = await cancelAppointment({
    id: req.params.id,
    reason,
    requester: req.user,
    ipAddress: req.ip,
  });

  return ApiResponse.success(res, 200, 'Appointment cancelled successfully.', appointment);
});

/**
 * Controller: Get doctor visit preparation summary.
 * Route: GET /api/v1/appointments/:id/preparation-summary
 */
export const getPrepSummary = asyncHandler(async (req, res) => {
  const summary = await getPreparationSummary({
    appointmentId: req.params.id,
    requester: req.user,
  });

  return ApiResponse.success(
    res,
    200,
    'Doctor appointment preparation summary generated successfully.',
    summary
  );
});

/**
 * Controller: Add family question for doctor.
 * Route: POST /api/v1/appointments/:id/questions
 */
export const addQuestion = asyncHandler(async (req, res) => {
  const { question } = req.body;
  const appointment = await addQuestionToAppointment({
    appointmentId: req.params.id,
    question,
    requester: req.user,
  });

  return ApiResponse.success(
    res,
    200,
    'Family question added to doctor preparation notes.',
    appointment
  );
});

/**
 * Controller: Trigger appointment reminders check.
 * Route: POST /api/v1/appointments/trigger-reminders
 */
export const triggerReminders = asyncHandler(async (req, res) => {
  const dispatched = await checkUpcomingAppointmentReminders();
  return ApiResponse.success(
    res,
    200,
    `Appointment reminder cycle completed. ${dispatched.length} reminders processed.`,
    { dispatched }
  );
});
