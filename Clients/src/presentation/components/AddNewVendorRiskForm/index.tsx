import { Button, SelectChangeEvent, Stack, useTheme } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { FC, useState } from "react";
import Field from "../Inputs/Field";
import DatePicker from "../Inputs/Datepicker";
import selectValidation from "../../../application/validations/selectValidation";
import { checkStringValidation } from "../../../application/validations/stringValidation";
import Alert from "../Alert";
import Select from "../Inputs/Select";

interface RiskSectionProps {
  closePopup: () => void
}

interface FormValues {
  vendorName: number,
  actionOwner: number,
  riskName: string,
  reviewDate: string,
  riskDescription: string
}

interface FormErrors {
  vendorName?: string,
  actionOwner?: string,
  riskName?: string,
  reviewDate?: string,
  riskDescription?: string
}

const initialState: FormValues = {
  vendorName: 0,
  actionOwner: 0,
  riskName: "",
  reviewDate: "",
  riskDescription: ""
}

const AddNewVendorRiskForm: FC<RiskSectionProps> = ({ closePopup }) => {
  const theme = useTheme();
  const [values, setValues] = useState<FormValues>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{
    variant: "success" | "info" | "warning" | "error";
    title?: string;
    body: string;
  } | null>(null);

  const handleDateChange = (newDate: Dayjs | null) => {
    setValues((prevValues) => ({
      ...prevValues,
      startDate: newDate ? newDate.toISOString() : ""
    }));
  };
  const handleOnSelectChange = (prop: keyof FormValues) => (event: SelectChangeEvent<string | number>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" });
  };
  const handleOnTextFieldChange = (prop: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
    setErrors({ ...errors, [prop]: "" });
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const riskName = checkStringValidation("Risk name", values.riskName, 1, 64);
    if (!riskName.accepted) {
      newErrors.riskName = riskName.message;
    }
    const riskDescription = checkStringValidation("Risk description", values.riskDescription, 1, 256);
    if (!riskDescription.accepted) {
      newErrors.riskDescription = riskDescription.message;
    }
    const reviewDate = checkStringValidation("Review date", values.reviewDate, 1);
    if (!reviewDate.accepted) {
      newErrors.reviewDate = reviewDate.message;
    }
    const vendorName = selectValidation("Vendor name", values.vendorName);
    if (!vendorName.accepted) {
      newErrors.vendorName = vendorName.message;
    }
    const actionOwner = selectValidation("Action owner", values.actionOwner);
    if (!actionOwner.accepted) {
      newErrors.actionOwner = actionOwner.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validateForm()) {
      //request to the backend
      closePopup();
    }
  }

  const fieldStyle = {
    backgroundColor: theme.palette.background.main,
    "& input": {
      padding: "0 14px"
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
      <Stack component="form" onSubmit={handleSubmit}>
        <Stack sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, rowGap: 8, mt: 13.5 }}>
          <Select
            id="vendor-name-input"
            label="Vendor name"
            placeholder="Select vendor"
            value={values.vendorName}
            onChange={handleOnSelectChange("vendorName")}
            items={[
              { _id: 1, name: "Some value 1" },
              { _id: 2, name: "Some value 2" },
              { _id: 3, name: "Some value 3" },
            ]}
            sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
            error={errors.vendorName}
            isRequired
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
            sx={{ width: "350px", backgroundColor: theme.palette.background.main }}
            error={errors.actionOwner}
            isRequired
          />
          <Field
            id="risk-name-input"
            label="Risk name"
            placeholder="Type in the risk"
            width="350px"
            value={values.riskName}
            onChange={handleOnTextFieldChange("riskName")}
            error={errors.riskName}
            sx={fieldStyle}
            isRequired
          />
          <DatePicker
            label="Review date"
            date={values.reviewDate ? dayjs(values.reviewDate) : null}
            handleDateChange={handleDateChange}
            sx={{
              width: "130px",
              "& input": { width: "85px" }
            }}
            isRequired
            error={errors.reviewDate}
          />
        </Stack>
        <Stack sx={{ marginTop: "16px" }}>
          <Field
            id="risk-description-input"
            label="Risk description"
            type="description"
            value={values.riskDescription}
            onChange={handleOnTextFieldChange("riskDescription")}
            sx={{ height: 101, backgroundColor: theme.palette.background.main }}
            isRequired
            error={errors.riskDescription}
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

export default AddNewVendorRiskForm;
