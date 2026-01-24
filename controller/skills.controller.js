import { skills } from '../model/skills.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';
import logger from '../logger/logger.js';


const createSkills = async(req, res) => {

    const{ skillName, created_by } = req.body;

    try {
        logger.info(`Creating skill: ${skillName}`);
     
        const checkSkillExisted = await skills.findOne({
            where: { name: skillName }
        })

        if(checkSkillExisted){
          logger.warn(`Skill already exists: ${skillName}`);
          return res.status(500).json(new ApiResponse(500,{},'Skill already existed'))
        }

       const title =  await skills.create({
            name: skillName,
            status: "1",
            created_by,
            created_on: new Date()
        })

        logger.info(`Skill created successfully: ${skillName} (ID: ${title.id})`);
        return res.status(200).json(new ApiResponse(200,title,'Skill added successfully'))
    } catch (error) {
        logger.error(`Error creating skill: ${error?.message}`);
      return res.status(500).json(new ApiResponse(500,{},error?.message))
    }
}

const getAllSkills = async(req, res) => {
    try {
        logger.info('Fetching all skills');
        const skill = await skills.findAll();

        logger.info(`Retrieved ${skill.length} skills`);
        return res.status(200).json(new ApiResponse(200, skill, "Care Facility Fetched Successfully"));
    } catch (error) {
        logger.error(`Error fetching skills: ${error.message}`);
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

const updateSkills =  async(req, res) => {

    const {id} = req.query;
    const { skillName } = req.body;

    try {
    logger.info(`Updating skill ID: ${id} to name: ${skillName}`);
    const skill = await skills.findByPk(id);
    if (!skill) {
      logger.warn(`Skill not found for update - ID: ${id}`);
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Skill not found"));
    }

    const duplicateSkill= await skills.findOne({
      where: {
        name: skillName,
        id: { [Op.ne]: id },
      },
    });

    if (duplicateSkill) {
      logger.warn(`Duplicate skill name attempted: ${skillName}`);
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Skill name already exists"));
    }

    skill.name = skillName;
    skill.updated_by = req.user?.id || null;
    skill.updated_on = new Date();
    await skill.save();

    logger.info(`Skill updated successfully - ID: ${id}`);
    return res
      .status(200)
      .json(new ApiResponse(200, skill, "Skill updated successfully"));

    } catch (error) {
    logger.error(`Error updating skill ID ${id}: ${error.message}`);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, error.message || "Internal server error while updating skill"));
    }
}

const deleteSkills = async(req, res) => {
    const { id } = req.query;

    try {
        logger.info(`Deleting skill ID: ${id}`);
        const skill = await skills.findByPk(id);

        if(!skill){
            logger.warn(`Skill not found for deletion - ID: ${id}`);
            return res.status(400).json({
                message: "skill not found"
            })
        }

        skill.deleted_by = req.user?.id || null;
        skill.deleted_on = new Date();
        skill.is_deleted = "Y";
        const deleteSkill = await skill.save();

        logger.info(`Skill deleted successfully - ID: ${id}`);
     return res.status(200).json({
        message: "skill deleted successfully",
        deleteSkill
     }) 

    } catch (error) {
        logger.error(`Error deleting skill ID ${id}: ${error.message}`);
        return res.status(500).json({
            error,
            message: "Error while deleting skill"
        })
    }
}

export { getAllSkills, createSkills, updateSkills, deleteSkills }