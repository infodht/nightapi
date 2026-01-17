import { skills } from '../model/skills.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';


const createSkills = async(req, res) => {

    const{ skillName, created_by } = req.body;

    // console.log("req.body",req.body)
    try {
     
        const checkSkillExisted = await skills.findOne({
            where: { name: skillName }
        })

        // console.log("checkJobExisted",checkJobExisted)

        if(checkSkillExisted){
          return res.status(500).json(new ApiResponse(500,{},'Skill already existed'))
        }

       const title =  await skills.create({
            name: skillName,
            status: "1",
            created_by,
            created_on: new Date()
        })

        return res.status(200).json(new ApiResponse(200,title,'Skill added successfully'))
    } catch (error) {
        console.log(error);
      return res.status(500).json(new ApiResponse(500,{},error?.message))
    }
}

const getAllSkills = async(req, res) => {
    try {
        const skill = await skills.findAll();

        return res.status(200).json(new ApiResponse(200, skill, "Care Facility Fetched Successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}

const updateSkills =  async(req, res) => {

    const {id} = req.query;
    const { skillName } = req.body;

    try {
    const skill = await skills.findByPk(id);
    if (!skill) {
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
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Skill name already exists"));
    }

    skill.name = skillName;
    skill.updated_by = req.user?.id || null;
    skill.updated_on = new Date();
    await skill.save();

    return res
      .status(200)
      .json(new ApiResponse(200, skill, "Skill updated successfully"));

    } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, error.message || "Internal server error while updating skill"));
    }
}

const deleteSkills = async(req, res) => {
    const { id } = req.query;

    try {
        const skill = await skills.findByPk(id);

        if(!skill){
            return res.status(400).json({
                message: "skill not found"
            })
        }

        skill.deleted_by = req.user?.id || null;
        skill.deleted_on = new Date();
        skill.is_deleted = "Y";
        const deleteSkill = await skill.save();

     return res.status(200).json({
        message: "skill deleted successfully",
        deleteSkill
     }) 

    } catch (error) {
        console.log("this error comes from deleting skill", error);
        return res.status(500).json({
            error,
            message: "Error while deleting skill"
        })
    }
}

export { getAllSkills, createSkills, updateSkills, deleteSkills }