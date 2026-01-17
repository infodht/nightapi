import { careFacility } from '../model/care_facility.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';

const createCareFacility = async(req, res) => {

    const{ careFacilityName, created_by } = req.body;
    try {
     
        const checkCareExisted = await careFacility.findOne({
            where: { facility_name: careFacilityName }
        })

        if(checkCareExisted){
          return res.status(500).json(new ApiResponse(500,{},'Care Facility already existed'))
        }

       const care =  await careFacility.create({
            facility_name: careFacilityName,
            status: "1",
            created_by,
            created_on: new Date()
        })

        return res.status(200).json(new ApiResponse(200,care,'Care Facility Needs added successfully'))
    } catch (error) {
        console.log(error);
      return res.status(500).json(new ApiResponse(500,{},error?.message))
    }
}

const getAllCareFacility = async(req, res) => {
    try {
        const careFacilities = await careFacility.findAll();

        return res.status(200).json(new ApiResponse(200, careFacilities, "Care Facility Fetched Successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

const updateFacilityName =  async(req, res) => {

    const {id} = req.query;
    const { careFacilityName } = req.body;

    try {
    const clientCareFacility = await careFacility.findByPk(id);
    if (!clientCareFacility) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Facility not found"));
    }

    const duplicateFacility = await careFacility.findOne({
      where: {
        facility_name: careFacilityName,
        id: { [Op.ne]: id },
      },
    });

    if (duplicateFacility) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Facility name already exists"));
    }

    clientCareFacility.facility_name = careFacilityName;
    clientCareFacility.updated_by = req.user?.id || null;
    clientCareFacility.updated_on = new Date();
    await clientCareFacility.save();

    return res
      .status(200)
      .json(new ApiResponse(200, clientCareFacility, "Care Facility updated successfully"));

    } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, error.message || "Internal server error while updating care facility"));
    }
}

const deleteCareFacility = async(req, res) => {
    const { id } = req.query;

    try {
        const clientCareFacility = await careFacility.findByPk(id);

        if(!clientCareFacility){
            return res.status(400).json({
                message: "Facility not found"
            })
        }
     clientCareFacility.deleted_by = req.user?.id || null;
     clientCareFacility.deleted_on = new Date();
     clientCareFacility.is_deleted = "Y";

     const deleteFacility = await clientCareFacility.save();

     return res.status(200).json({
        message: "Facility deleted successfully",
        deleteFacility
     }) 

    } catch (error) {
        console.log("this error comes from deleting care facility", error);
        return res.status(500).json({
            error,
            message: "Error while deleting care facility"
        })
    }
}

export { getAllCareFacility, createCareFacility, updateFacilityName, deleteCareFacility }