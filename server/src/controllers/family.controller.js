import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  getFamilyDashboardOverview,
  getFilteredFamilyActivityFeed,
  getFamilyResidentDetail,
} from '../services/family.service.js';

/**
 * Controller: Retrieve comprehensive family dashboard overview.
 * Route: GET /api/v1/family/dashboard
 */
export const getFamilyDashboard = asyncHandler(async (req, res) => {
  const data = await getFamilyDashboardOverview(req.user);
  return ApiResponse.success(res, 200, 'Family dashboard overview retrieved successfully', data);
});

/**
 * Controller: Retrieve filtered activity feed for family member.
 * Route: GET /api/v1/family/activity-feed
 */
export const getActivityFeed = asyncHandler(async (req, res) => {
  const { elderlyUserId, category = 'all', dateRange = '7days', limit = 40 } = req.query;

  const feed = await getFilteredFamilyActivityFeed({
    familyUser: req.user,
    elderlyUserId: elderlyUserId || null,
    category,
    dateRange,
    limit: parseInt(limit, 10) || 40,
  });

  return ApiResponse.success(res, 200, 'Family activity feed retrieved successfully', feed);
});

/**
 * Controller: Retrieve detailed elderly resident profile for family member.
 * Route: GET /api/v1/family/resident/:elderlyId
 */
export const getResidentDetail = asyncHandler(async (req, res) => {
  const { elderlyId } = req.params;

  const data = await getFamilyResidentDetail({
    elderlyUserId: elderlyId,
    familyUser: req.user,
  });

  return ApiResponse.success(res, 200, 'Resident family overview retrieved successfully', data);
});
