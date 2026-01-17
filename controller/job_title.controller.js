import { job_title } from '../model/job_title.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';

const createJobTitle = async(req, res) => {

    const{ titleName, created_by } = req.body;

    // console.log("req.body",req.body)
    try {
     
        const checkJobExisted = await job_title.findOne({
            where: { name: titleName }
        })

        // console.log("checkJobExisted",checkJobExisted)

        if(checkJobExisted){
          return res.status(500).json(new ApiResponse(500,{},'Job title already existed'))
        }

       const title =  await job_title.create({
            name: titleName,
            status: "1",
            created_by,
            created_on: new Date()
        })

        return res.status(200).json(new ApiResponse(200,title,'Job title added successfully'))
    } catch (error) {
        console.log(error);
      return res.status(500).json(new ApiResponse(500,{},error?.message))
    }
}

const getJobTitle = async(req, res) => {
    try {
        const jobTitles = await job_title.findAll();

        return res.status(200).json(new ApiResponse(200, jobTitles, "Job Title Fetched Successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, error.message, error, error.stack))
    }
}


const updateJobTitle =  async(req, res) => {

    const {id} = req.query;
    const { titleName } = req.body;

    try {
    const title = await job_title.findByPk(id);
    if (!title) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "Job title not found"));
    }

    const duplicateTitle = await job_title.findOne({
      where: {
        name: titleName,
        id: { [Op.ne]: id },
      },
    });

    if (duplicateTitle) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Job title name already exists"));
    }

    title.name = titleName;
    title.updated_by = req.user?.id || null;
    title.updated_on = new Date() ;
    await title.save();

    return res
      .status(200)
      .json(new ApiResponse(200, title, "Job title updated successfully"));

    } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, error.message || "Internal server error while updating job titles"));
    }
}

const deleteJobTitle = async(req, res) => {
    const { id } = req.query;

    try {
        const title = await job_title.findByPk(id);

        if(!title){
            return res.status(400).json({
                message: "job title not found"
            })
        }

        title.deleted_by = req.user?.id || null;
        title.deleted_on = new Date();
        title.is_deleted = "Y";

     const deleteTitle = await title.save();

     return res.status(200).json({
        message: "job title deleted successfully",
        deleteTitle
     }) 

    } catch (error) {
        console.log("this error comes from deleting job title", error);
        return res.status(500).json({
            error,
            message: "Error while deleting job title"
        })
    }
}

export { getJobTitle, createJobTitle, updateJobTitle, deleteJobTitle }