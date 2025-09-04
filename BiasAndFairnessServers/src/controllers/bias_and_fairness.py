import io
import asyncio
import json
import yaml
import os
from pathlib import Path
from fastapi.responses import JSONResponse, Response
from fastapi import HTTPException
from crud.bias_and_fairness import (
    upload_model, upload_data, insert_metrics, get_metrics_by_id, 
    get_all_metrics_query, delete_metrics_by_id,
    insert_bias_fairness_evaluation, get_all_bias_fairness_evaluations,
    get_bias_fairness_evaluation_by_id, update_bias_fairness_evaluation_status,
    delete_bias_fairness_evaluation
)
from utils.run_bias_and_fairness_check import analyze_fairness
from utils.handle_files_uploads import process_files
from utils.process_evaluation import process_evaluation
from database.db import get_db
from fastapi import UploadFile, BackgroundTasks
from database.redis import get_next_job_id, get_job_status, delete_job_status

async def get_all_metrics(tenant: str):
    """
    Retrieve all fairness metrics.
    """
    try:
        async with get_db() as db:
            metrics = await get_all_metrics_query(db, tenant)
            return JSONResponse(
                status_code=200,
                content=[
                    {
                        "model_id": row.model_id,
                        "model_filename": row.model_filename,
                        "data_id": row.data_id,
                        "data_filename": row.data_filename,
                        "metrics_id": row.metrics_id
                    } for row in metrics
                ]
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve metrics, {str(e)}"
        )

async def get_metrics(id: int, tenant: str):
    """
    Retrieve metrics for a given fairness run ID.
    """
    try:
        async with get_db() as db:
            metrics = await get_metrics_by_id(id, db, tenant)
            if not metrics:
                raise HTTPException(
                    status_code=404,
                    detail=f"Metrics with ID {id} not found"
                )
            return JSONResponse(
                status_code=200,
                content={
                    "model_id": metrics.model_id,
                    "data_id": metrics.data_id,
                    "metrics_id": metrics.metrics_id,
                    "metrics": metrics.metrics
                }
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve metrics, {str(e)}"
        )

async def get_upload_status(job_id: int, tenant: str):
    value = await get_job_status(job_id)
    if value is None:
        return Response(status_code=204)
    await delete_job_status(job_id)
    return JSONResponse(
        status_code=200,
        content=value,
        media_type="application/json"
    )

async def handle_upload(background_tasks: BackgroundTasks, model: UploadFile, data: UploadFile, target_column: str, sensitive_column: str, tenant: str):
    """
    Handle file upload from the client.
    """
    job_id = await get_next_job_id()
    response = JSONResponse(status_code=202, content={
        "message": "Processing started", 
        "job_id": job_id,
        "model_filename": model.filename.replace(".gz", "") if model.filename else "",
        "data_filename": data.filename.replace(".gz", "") if data.filename else ""
    }, media_type="application/json")
    model_ = {
        "filename": model.filename,
        "content": await model.read()
    }
    data_ = {
        "filename": data.filename,
        "content": await data.read()
    }
    # create a job ID or use a unique identifier for the task
    background_tasks.add_task(process_files, job_id, model_, data_, target_column, sensitive_column, tenant)
    return response

# New controller functions for Bias and Fairness Module
async def handle_evaluation(
    background_tasks: BackgroundTasks, 
    model: UploadFile, 
    dataset: UploadFile, 
    target_column: str, 
    sensitive_columns: str,  # JSON string
    evaluation_metrics: str,  # JSON string
    fairness_threshold: float,
    bias_detection_methods: str,  # JSON string
    tenant: str
):
    """
    Handle advanced bias and fairness evaluation.
    """
    try:
        # Parse JSON strings
        sensitive_cols = json.loads(sensitive_columns)
        metrics = json.loads(evaluation_metrics)
        bias_methods = json.loads(bias_detection_methods)
        
        evaluation_id = f"eval_{tenant}_{int(asyncio.get_event_loop().time() * 1000)}"
        
        response = JSONResponse(status_code=202, content={
            "evaluationId": evaluation_id,
            "status": "pending",
            "message": "Evaluation started"
        }, media_type="application/json")
        
        model_ = {
            "filename": model.filename,
            "content": await model.read()
        }
        dataset_ = {
            "filename": dataset.filename,
            "content": await dataset.read()
        }
        
        # Add background task for evaluation
        background_tasks.add_task(
            process_evaluation, 
            evaluation_id, 
            model_, 
            dataset_, 
            target_column, 
            sensitive_cols, 
            metrics, 
            fairness_threshold, 
            bias_methods, 
            tenant
        )
        
        return response
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start evaluation: {str(e)}"
        )

async def get_evaluation_status(evaluation_id: str, tenant: str):
    """
    Get the status of an evaluation.
    """
    try:
        # This would typically check a database or Redis for status
        # For now, return a mock status
        return JSONResponse(
            status_code=200,
            content={
                "evaluationId": evaluation_id,
                "status": "running",
                "progress": 75
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get evaluation status: {str(e)}"
        )

async def get_evaluation_results(evaluation_id: str, tenant: str):
    """
    Get the results of a completed evaluation.
    """
    try:
        # This would typically fetch from database
        # For now, return mock results
        return JSONResponse(
            status_code=200,
            content={
                "evaluationId": evaluation_id,
                "results": {
                    "fairness_metrics": {},
                    "bias_analysis": {},
                    "recommendations": []
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get evaluation results: {str(e)}"
        )

async def get_all_evaluations(tenant: str):
    """
    Get all evaluations for a tenant.
    """
    try:
        # This would typically fetch from database
        # For now, return empty list
        return JSONResponse(
            status_code=200,
            content=[]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get evaluations: {str(e)}"
        )

async def cancel_evaluation(evaluation_id: str, tenant: str):
    """
    Cancel a running evaluation.
    """
    try:
        # This would typically update database/Redis status
        return JSONResponse(
            status_code=200,
            content={"message": "Evaluation cancelled successfully"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel evaluation: {str(e)}"
        )

async def delete_metrics(id: int, tenant: str):
    """
    Delete metrics for a given fairness run ID.
    """
    try:
        async with get_db() as db:
            delete = await delete_metrics_by_id(id, db, tenant)
            if not delete:
                raise HTTPException(
                    status_code=404,
                    detail=f"Metrics with ID {id} not found"
                )
            await db.commit()
            return Response(status_code=204)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete metrics, {str(e)}"
        )

async def create_config_and_run_evaluation(background_tasks: BackgroundTasks, config_data: dict, tenant: str):
    """
    Create config.yaml file and run bias and fairness evaluation.
    """
    try:
        # Create config directory if it doesn't exist
        config_dir = Path("BiasAndFairnessModule/configs")
        config_dir.mkdir(parents=True, exist_ok=True)
        
        # Create config.yaml with frontend values and defaults
        config = {
            "dataset": {
                "name": config_data.get("dataset", {}).get("name", "adult-census-income"),
                "source": config_data.get("dataset", {}).get("source", "scikit-learn/adult-census-income"),
                "split": config_data.get("dataset", {}).get("split", "train"),
                "platform": config_data.get("dataset", {}).get("platform", "huggingface"),
                "protected_attributes": config_data.get("protected_attributes", ["sex", "race"]),
                "target_column": config_data.get("target_column", "income"),
                "sampling": {
                    "enabled": config_data.get("sampling", {}).get("enabled", True),
                    "n_samples": config_data.get("sampling", {}).get("n_samples", 50),
                    "random_seed": config_data.get("sampling", {}).get("random_seed", 42)
                }
            },
            "post_processing": {
                "binary_mapping": {
                    "favorable_outcome": config_data.get("post_processing", {}).get("binary_mapping", {}).get("favorable_outcome", ">50K"),
                    "unfavorable_outcome": config_data.get("post_processing", {}).get("binary_mapping", {}).get("unfavorable_outcome", "<=50K")
                },
                "attribute_groups": config_data.get("post_processing", {}).get("attribute_groups", {
                    "sex": {
                        "privileged": ["Male"],
                        "unprivileged": ["Female"]
                    },
                    "race": {
                        "privileged": ["White"],
                        "unprivileged": ["Black", "Other"]
                    }
                })
            },
            "model": {
                "model_task": config_data.get("model", {}).get("model_task", "binary_classification"),
                "label_behavior": config_data.get("model", {}).get("label_behavior", "binary"),
                "huggingface": {
                    "enabled": True,
                    "model_id": config_data.get("model", {}).get("model_id", "TinyLlama/TinyLlama-1.1B-Chat-v1.0"),
                    "device": "cuda",
                    "max_new_tokens": 50,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "system_prompt": "You are a strict classifier. You must answer with exactly one of these two strings: '>50K' or '<=50K'. No explanation. No formatting."
                }
            },
            "metrics": {
                "fairness": {
                    "enabled": True,
                    "metrics": config_data.get("metrics", {}).get("fairness", ["demographic_parity", "equalized_odds", "predictive_parity"])
                },
                "performance": {
                    "enabled": True,
                    "metrics": config_data.get("metrics", {}).get("performance", ["accuracy", "precision", "recall", "f1_score"])
                }
            },
            "artifacts": {
                "inference_results_path": "artifacts/cleaned_inference_results.csv",
                "postprocessed_results_path": "artifacts/postprocessed_results.csv"
            }
        }
        
        # Write config to file
        config_path = config_dir / "config.yaml"
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, indent=2)
        
        # Create job ID for tracking
        job_id = await get_next_job_id()
        
        # Generate unique evaluation ID
        eval_id = f"eval_{int(job_id)}_{int(asyncio.get_event_loop().time())}"
        
        # Save evaluation to database
        async with get_db() as db:
            await insert_bias_fairness_evaluation(
                eval_id=eval_id,
                model_name=config_data.get("model", {}).get("model_id", "Unknown Model"),
                dataset_name=config_data.get("dataset", {}).get("name", "Unknown Dataset"),
                model_task=config_data.get("model", {}).get("model_task", "binary_classification"),
                label_behavior=config_data.get("model", {}).get("label_behavior", "binary"),
                config_data=json.dumps(config),
                tenant=tenant,
                db=db
            )
        
        # Start background task to run evaluation
        background_tasks.add_task(
            run_bias_fairness_evaluation, 
            job_id, 
            str(config_path), 
            eval_id,
            tenant
        )
        
        return JSONResponse(
            status_code=202,
            content={
                "message": "Configuration created and evaluation started",
                "job_id": job_id,
                "eval_id": eval_id,
                "config_path": str(config_path)
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create config and start evaluation: {str(e)}"
        )

async def run_bias_fairness_evaluation(job_id: int, config_path: str, eval_id: str, tenant: str):
    """
    Run the bias and fairness evaluation using the created config.
    """
    try:
        # Update status to running
        async with get_db() as db:
            await update_bias_fairness_evaluation_status(eval_id, "running", None, db, tenant)
        
        # Change to the BiasAndFairnessModule directory
        os.chdir("BiasAndFairnessModule")
        
        # Run the evaluation using the CLI
        import subprocess
        import sys
        
        # Run the evaluation
        result = subprocess.run([
            sys.executable, "-m", "src.core.cli", "prompt",
            "--config", config_path,
            "--limit", "50",
            "--output", "artifacts/clean_results.json"
        ], capture_output=True, text=True, cwd=".")
        
        if result.returncode == 0:
            # Read the results
            results_path = Path("artifacts/clean_results.json")
            if results_path.exists():
                with open(results_path, 'r') as f:
                    results = json.load(f)
                
                # Update status to completed with results
                async with get_db() as db:
                    await update_bias_fairness_evaluation_status(eval_id, "completed", results, db, tenant)
                
                # Update job status
                await update_job_status(job_id, {
                    "status": "completed",
                    "eval_id": eval_id,
                    "results": results,
                    "message": "Evaluation completed successfully"
                })
            else:
                # Update status to failed
                async with get_db() as db:
                    await update_bias_fairness_evaluation_status(eval_id, "failed", None, db, tenant)
                
                await update_job_status(job_id, {
                    "status": "failed",
                    "eval_id": eval_id,
                    "error": "Results file not found",
                    "message": "Evaluation failed - results file not generated"
                })
        else:
            # Update status to failed
            async with get_db() as db:
                await update_bias_fairness_evaluation_status(eval_id, "failed", None, db, tenant)
            
            await update_job_status(job_id, {
                "status": "failed",
                "eval_id": eval_id,
                "error": result.stderr,
                "message": "Evaluation failed - CLI execution error"
            })
            
    except Exception as e:
        # Update status to failed
        async with get_db() as db:
            await update_bias_fairness_evaluation_status(eval_id, "failed", None, db, tenant)
        
        await update_job_status(job_id, {
            "status": "failed",
            "eval_id": eval_id,
            "error": str(e),
            "message": f"Evaluation failed: {str(e)}"
        })

async def update_job_status(job_id: int, status_data: dict):
    """
    Update the job status in Redis.
    """
    try:
        from database.redis import set_job_status
        await set_job_status(job_id, status_data)
    except Exception as e:
        print(f"Failed to update job status: {e}")

async def get_all_bias_fairness_evaluations_controller(tenant: str):
    """Get all bias and fairness evaluations for a tenant."""
    try:
        async with get_db() as db:
            evaluations = await get_all_bias_fairness_evaluations(db, tenant)
            return JSONResponse(
                status_code=200,
                content=evaluations
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evaluations: {str(e)}"
        )

async def get_bias_fairness_evaluation_by_id_controller(eval_id: str, tenant: str):
    """Get a specific bias and fairness evaluation by eval_id."""
    try:
        async with get_db() as db:
            evaluation = await get_bias_fairness_evaluation_by_id(eval_id, db, tenant)
            if not evaluation:
                raise HTTPException(
                    status_code=404,
                    detail=f"Evaluation with ID {eval_id} not found"
                )
            return JSONResponse(
                status_code=200,
                content=evaluation
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evaluation: {str(e)}"
        )

async def delete_bias_fairness_evaluation_controller(eval_id: str, tenant: str):
    """Delete a bias and fairness evaluation."""
    try:
        async with get_db() as db:
            result = await delete_bias_fairness_evaluation(eval_id, db, tenant)
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Evaluation with ID {eval_id} not found"
                )
            return JSONResponse(
                status_code=200,
                content={"message": f"Evaluation {eval_id} deleted successfully"}
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete evaluation: {str(e)}"
        )
