import asyncHandler from 'express-async-handler';
import AppError from '../utils/AppError.js';
import Company from '../models/Company.js';

const authorizeCompany = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    const companyId = req.params.companyId;

    if (!companyId) {
      throw new AppError('Company ID is required for authorization', 400);
    }

    const company = await Company.findById(companyId);

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    const isOwner = company.owner.toString() === req.user._id.toString();

    if (!isOwner) {
      throw new AppError('Not authorized to access this company', 403);
    }

    if (roles.length > 0 && !roles.includes('owner')) {
      throw new AppError('Not authorized for this action in the company', 403);
    }

    req.company = company;
    next();
  });
};

export default authorizeCompany;
