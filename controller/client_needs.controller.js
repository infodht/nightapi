import { client_needs } from '../model/client_needs.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';

const createClientNeeds = async(req, res) => {

    const{ clientNeedsName, created_by } = req.body;
    try {
     
        const checkNeedsExisted = await client_needs.findOne({
            where: { name: clientNeedsName }
        })

        if(checkNeedsExisted){
          return res.status(500).json(new ApiResponse(500,{},'Care Needs already existed'))
        }

       const care =  await client_needs.create({
            name: clientNeedsName,
            status: "1",
            created_by,
            created_on: new Date()
        })

        return res.status(200).json(new ApiResponse(200,care,'Client Needs added successfully'))
    } catch (error) {
        console.log(error);
      return res.status(500).json(new ApiResponse(500,{},error?.message))
    }
}

const getAllNeeds = async(req, res) => {
    try {
        const clientNeeds = await client_needs.findAll();

        return res.status(200).json(new ApiResponse(200, clientNeeds, "Client Needs Fetched Successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

const updateClientNeeds =  async(req, res) => {

    const {id} = req.query;
    const { clientNeedName } = req.body;

    try {
    const clientNeeds = await client_needs.findByPk(id);
    if (!clientNeeds) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Client needs not found"));
    }

    const duplicateNeeds = await client_needs.findOne({
      where: {
        name: clientNeedName,
        id: { [Op.ne]: id },
      },
    });

    if (duplicateNeeds) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "client need already exists"));
    }

    clientNeeds.name = clientNeedName;
    clientNeeds.updated_by = req.user?.id || null;
    clientNeeds.updated_on = new Date();
    await clientNeeds.save();

    return res
      .status(200)
      .json(new ApiResponse(200, clientNeeds, "Client needs updated successfully"));

    } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, error.message || "Internal server error while updating client needs"));
    }
}

const deleteClientNeeds = async(req, res) => {
    const { id } = req.query;

    try {
        const clientClientNeeds = await client_needs.findByPk(id);

        if(!clientClientNeeds){
            return res.status(400).json({
                message: "Needs not found"
            })
        }
        
        clientClientNeeds.deleted_by = req.user?.id || null;
        clientClientNeeds.deleted_on = new Date();
        clientClientNeeds.is_deleted = "Y";
        const deleteFacility = await clientClientNeeds.save();

     return res.status(200).json({
        message: "Needs deleted successfully",
        deleteFacility
     }) 

    } catch (error) {
        console.log("this error comes from deleting client needs", error);
        return res.status(500).json({
            error,
            message: "Error while deleting client needs"
        })
    }
}


export { getAllNeeds, createClientNeeds, updateClientNeeds, deleteClientNeeds };