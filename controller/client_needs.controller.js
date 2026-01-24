import { client_needs } from '../model/client_needs.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';
import logger from '../logger/logger.js';

const createClientNeeds = async(req, res) => {

    const{ clientNeedsName, created_by } = req.body;
    try {
        logger.info(`Creating client need: ${clientNeedsName}`);
     
        const checkNeedsExisted = await client_needs.findOne({
            where: { name: clientNeedsName }
        })

        if(checkNeedsExisted){
          logger.warn(`Client need already exists: ${clientNeedsName}`);
          return res.status(500).json(new ApiResponse(500,{},'Care Needs already existed'))
        }

       const care =  await client_needs.create({
            name: clientNeedsName,
            status: "1",
            created_by,
            created_on: new Date()
        })

        logger.info(`Client need created successfully: ${clientNeedsName} (ID: ${care.id})`);
        return res.status(200).json(new ApiResponse(200,care,'Client Needs added successfully'))
    } catch (error) {
        logger.error(`Error creating client need: ${error?.message}`);
      return res.status(500).json(new ApiResponse(500,{},error?.message))
    }
}

const getAllNeeds = async(req, res) => {
    try {
        logger.info('Fetching all client needs');
        const clientNeeds = await client_needs.findAll();

        logger.info(`Retrieved ${clientNeeds.length} client needs`);
        return res.status(200).json(new ApiResponse(200, clientNeeds, "Client Needs Fetched Successfully"));
    } catch (error) {
        logger.error(`Error fetching client needs: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

const updateClientNeeds =  async(req, res) => {

    const {id} = req.query;
    const { clientNeedName } = req.body;

    try {
    logger.info(`Updating client need ID: ${id} to name: ${clientNeedName}`);
    const clientNeeds = await client_needs.findByPk(id);
    if (!clientNeeds) {
      logger.warn(`Client need not found for update - ID: ${id}`);
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
      logger.warn(`Duplicate client need name attempted: ${clientNeedName}`);
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "client need already exists"));
    }

    clientNeeds.name = clientNeedName;
    clientNeeds.updated_by = req.user?.id || null;
    clientNeeds.updated_on = new Date();
    await clientNeeds.save();

    logger.info(`Client need updated successfully - ID: ${id}`);
    return res
      .status(200)
      .json(new ApiResponse(200, clientNeeds, "Client needs updated successfully"));

    } catch (error) {
    logger.error(`Error updating client need ID ${id}: ${error.message}`);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, error.message || "Internal server error while updating client needs"));
    }
}

const deleteClientNeeds = async(req, res) => {
    const { id } = req.query;

    try {
        logger.info(`Deleting client need ID: ${id}`);
        const clientClientNeeds = await client_needs.findByPk(id);

        if(!clientClientNeeds){
            logger.warn(`Client need not found for deletion - ID: ${id}`);
            return res.status(400).json({
                message: "Needs not found"
            })
        }
        
        clientClientNeeds.deleted_by = req.user?.id || null;
        clientClientNeeds.deleted_on = new Date();
        clientClientNeeds.is_deleted = "Y";
        const deleteFacility = await clientClientNeeds.save();

        logger.info(`Client need deleted successfully - ID: ${id}`);
     return res.status(200).json({
        message: "Needs deleted successfully",
        deleteFacility
     }) 

    } catch (error) {
        logger.error(`Error deleting client need ID ${id}: ${error.message}`);
        return res.status(500).json({
            error,
            message: "Error while deleting client needs"
        })
    }
}


export { getAllNeeds, createClientNeeds, updateClientNeeds, deleteClientNeeds };