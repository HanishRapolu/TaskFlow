import asyncHandler from 'express-async-handler';
import companyService from '../services/companyService.js';

export const getMyCompany = asyncHandler(async (req, res) => {
  const company = await companyService.getMyCompany(req.user._id);
  res.status(200).json({
    success: true,
    data: {
      _id: company._id,
      name: company.name,
      description: company.description,
    },
  });
});

export const getCompany = asyncHandler(async (req, res) => {
  const company = await companyService.getCompany(req.params.companyId, req.user._id);
  res.status(200).json({
    success: true,
    data: {
      _id: company._id,
      name: company.name,
      description: company.description,
    },
  });
});

export const createCompany = asyncHandler(async (req, res) => {
  const company = await companyService.createCompany(req.body, req.user._id);
  res.status(201).json({
    success: true,
    data: {
      _id: company._id,
      name: company.name,
      description: company.description,
    },
  });
});

export const getCompanyWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await companyService.getCompanyWorkspaces(req.params.companyId, req.user._id);
  res.status(200).json({
    success: true,
    data: workspaces,
  });
});

export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await companyService.createWorkspace(req.params.companyId, req.body, req.user._id);
  res.status(201).json({
    success: true,
    data: {
      _id: workspace._id,
      name: workspace.name,
      description: workspace.description,
    },
  });
});

export const deleteCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  await companyService.deleteCompany(companyId, req.user._id);
  res.status(200).json({ success: true, message: 'Company deleted successfully' });
});
