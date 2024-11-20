import { Stack, Divider, Typography, useTheme, Button, SelectChangeEvent } from "@mui/material"
import { FC, useState } from "react"
import Field from "../../Inputs/Field"
import Select from "../../Inputs/Select";
import RiskLevel from "../../RiskLevel";
import { Likelihood, Severity } from "../../RiskLevel/constants";
import { checkStringValidation } from "../../../../application/validations/stringValidation";
import Alert from "../../Alert";
import selectValidation from "../../../../application/validations/selectValidation";

interface RiskSectionProps {
    closePopup: () => void
}

interface RiskFormValues {
    riskName: string,
    actionOwner: number,
    aiLifecyclePhase: number,
    riskDescription: string,
    riskCategory: number,
    potentialImpact: string,
    assessmentMapping: number,
    controlsMapping: number,
    likelihood: Likelihood,
    riskSeverity: Severity,
    riskLevel: number,
    reviewNotes: string
}

interface FormErrors {
    riskName?: string,
    actionOwner?: string,
    aiLifecyclePhase?: string,
    riskDescription?: string,
    riskCategory?: string,
    potentialImpact?: string,
    assessmentMapping?: string,
    controlsMapping?: string,
    reviewNotes?: string
}

const initialState: RiskFormValues = {
    riskName: "",
    actionOwner: 0,
    aiLifecyclePhase: 0,
    riskDescription: "",
    riskCategory: 0,
    potentialImpact: "",
    assessmentMapping: 0,
    controlsMapping: 0,
    likelihood: 1 as Likelihood,
    riskSeverity: 1 as Severity,
    riskLevel: 0,
    reviewNotes: ""
}

const RiskSection: FC<RiskSectionProps> = ({ closePopup }) => {
    const theme = useTheme();
    const [values, setValues] = useState<RiskFormValues>(initialState);
    const [errors, setErrors] = useState<FormErrors>({});
    const [alert, setAlert] = useState<{
        variant: "success" | "info" | "warning" | "error";
        title?: string;
        body: string;
    } | null>(null);

    const handleOnSelectChange = (prop: keyof RiskFormValues) => (event: SelectChangeEvent<string | number>) => {
        setValues({ ...values, [prop]: event.target.value });
        setErrors({ ...errors, [prop]: "" });
    };
    const handleOnTextFieldChange =
        (prop: keyof RiskFormValues) =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setValues({ ...values, [prop]: event.target.value });
                setErrors({ ...errors, [prop]: "" });
            };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        const riskName = checkStringValidation("Risk name", values.riskName, 3, 50);
        if (!riskName.accepted) {
            newErrors.riskName = riskName.message;
        }
        const riskDescription = checkStringValidation("Risk description", values.riskDescription, 1, 256);
        if (!riskDescription.accepted) {
            newErrors.riskDescription = riskDescription.message;
        }
        const potentialImpact = checkStringValidation("Potential impact", values.potentialImpact, 1, 256);
        if (!potentialImpact.accepted) {
            newErrors.potentialImpact = potentialImpact.message;
        }
        const reviewNotes = checkStringValidation("Review notes", values.reviewNotes, 0, 1024);
        if (!reviewNotes.accepted) {
            newErrors.reviewNotes = reviewNotes.message;
        }
        const actionOwner = selectValidation("Action owner", values.actionOwner);
        if (!actionOwner.accepted) {
          newErrors.actionOwner = actionOwner.message;
        }
        const aiLifecyclePhase = selectValidation("AI lifecycle phase", values.aiLifecyclePhase);
        if (!aiLifecyclePhase.accepted) {
          newErrors.aiLifecyclePhase = aiLifecyclePhase.message;
        }
        const riskCategory = selectValidation("Risk category", values.riskCategory);
        if (!riskCategory.accepted) {
          newErrors.riskCategory = riskCategory.message;
        }
        const assessmentMapping = selectValidation("Assessment mapping", values.assessmentMapping);
        if (!assessmentMapping.accepted) {
          newErrors.assessmentMapping = assessmentMapping.message;
        }
        const controlsMapping = selectValidation("Controls mapping", values.controlsMapping);
        if (!controlsMapping.accepted) {
          newErrors.controlsMapping = controlsMapping.message;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // Return true if no errors exist
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (validateForm()) {
            //request to the backend
            closePopup();
        }
    }

    return (
        <Stack>
            {alert && (
                <Alert
                    variant={alert.variant}
                    title={alert.title}
                    body={alert.body}
                    isToast={true}
                    onClick={() => setAlert(null)}
                />
            )}
            <Stack className="AddNewRiskForm" component="form" onSubmit={handleSubmit}>
                <Stack sx={{ flexDirection: "row", columnGap: 13, mb: 10 }}>
                    <Stack sx={{ display: "grid", gridTemplateColumns: "324px 324px", columnGap: 13, rowGap: 8.5 }}>
                        <Field
                            id="risk-name-input"
                            label="Risk name"
                            placeholder="Write risk name"
                            width={324}
                            value={values.riskName}
                            onChange={handleOnTextFieldChange("riskName")}
                            sx={{
                                backgroundColor: theme.palette.background.main,
                                "& input": {
                                    padding: "0 14px"
                                }
                            }}
                            isRequired
                            error={errors.riskName}
                        />
                        <Field
                            id="risk-description-input"
                            label="Risk description"
                            width={324}
                            value={values.riskDescription}
                            onChange={handleOnTextFieldChange("riskDescription")}
                            sx={{
                                backgroundColor: theme.palette.background.main,
                                "& input": {
                                    padding: "0 14px"
                                }
                            }}
                            isRequired
                            error={errors.riskDescription}
                        />
                        <Select
                            id="assessment-mapping-input"
                            label="Assessment mapping"
                            placeholder="Map assessment"
                            value={values.assessmentMapping}
                            onChange={handleOnSelectChange("assessmentMapping")}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.assessmentMapping}
                        />
                        <Select
                            id="action-owner-input"
                            label="Action owner"
                            placeholder="Select owner"
                            value={values.actionOwner}
                            onChange={handleOnSelectChange("actionOwner")}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.actionOwner}
                        />
                        <Select
                            id="risk-category-input"
                            label="Risk category"
                            placeholder="Select category"
                            value={values.riskCategory}
                            onChange={handleOnSelectChange("riskCategory")}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.riskCategory}
                        />
                        <Select
                            id="controls-mapping-input"
                            label="Controls mapping"
                            placeholder="Map controls"
                            value={values.controlsMapping}
                            onChange={handleOnSelectChange("controlsMapping")}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.controlsMapping}
                        />
                    </Stack>
                    <Stack sx={{ rowGap: 8.5 }}>
                        <Select
                            id="ai-lifecycle-phase-input"
                            label="AI lifecycle phase"
                            placeholder="Select phase"
                            value={values.aiLifecyclePhase}
                            onChange={handleOnSelectChange("aiLifecyclePhase")}
                            items={[
                                { _id: 1, name: "Some value 1" },
                                { _id: 2, name: "Some value 2" },
                                { _id: 3, name: "Some value 3" },
                            ]}
                            sx={{ width: 324, backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.aiLifecyclePhase}
                        />
                        <Field
                            id="potential-impact-input"
                            label="Potential Impact"
                            type="description"
                            value={values.potentialImpact}
                            onChange={handleOnTextFieldChange("potentialImpact")}
                            sx={{ backgroundColor: theme.palette.background.main }}
                            isRequired
                            error={errors.potentialImpact}
                        />
                    </Stack>
                </Stack>
                <Divider />
                <Typography sx={{ fontSize: 16, fontWeight: 600, mt: 6.5 }}>Calculate risk level</Typography>
                <Typography sx={{ fontSize: theme.typography.fontSize, mb: 8 }}>The Risk Level is calculated by multiplying the Likelihood and Severity scores. By assigning these scores, the risk level will be determined based on your inputs.</Typography>
                <RiskLevel likelihood={values.likelihood} riskSeverity={values.riskSeverity} handleOnSelectChange={handleOnSelectChange} />
                <Divider />
                <Stack sx={{ mt: 4.5 }}>
                    <Field
                        id="review-notes-input"
                        label="Review notes"
                        type="description"
                        value={values.reviewNotes}
                        onChange={handleOnTextFieldChange("reviewNotes")}
                        sx={{ backgroundColor: theme.palette.background.main }}
                        isOptional
                        error={errors.reviewNotes}
                    />
                </Stack>
                <Button
                    type="submit"
                    variant="contained"
                    disableRipple={theme.components?.MuiButton?.defaultProps?.disableRipple}
                    sx={{
                        borderRadius: 2, maxHeight: 34,
                        textTransform: "inherit",
                        backgroundColor: "#4C7DE7",
                        boxShadow: "none",
                        border: "1px solid #175CD3",
                        ml: "auto",
                        mr: 0,
                        mt: "30px",
                        "&:hover": { boxShadow: "none" }
                    }}
                >Save</Button>
            </Stack>
        </Stack>
    )
}

export default RiskSection;