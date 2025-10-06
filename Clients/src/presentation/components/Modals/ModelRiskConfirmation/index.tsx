import { Button, Modal, Stack, Typography, useTheme } from "@mui/material";
import { useModalKeyHandling } from "../../../../application/hooks/useModalKeyHandling";
import {
  BasicModalCancelButtonStyle,
  BasicModalDeleteButtonStyle,
} from "../Basic/style";

interface ModelRiskConfirmationProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onConfirm: (deleteRisks: boolean) => void;
  onCancel: () => void;
}

const ModelRiskConfirmation: React.FC<ModelRiskConfirmationProps> = ({
  isOpen,
  setIsOpen,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();

  useModalKeyHandling({
    isOpen,
    onClose: () => setIsOpen(false)
  });

  const handleKeepRisks = () => {
    onConfirm(false);
    setIsOpen(false);
  };

  const handleDeleteRisks = () => {
    onConfirm(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    onCancel();
    setIsOpen(false);
  };

  return (
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== 'backdropClick') {
          setIsOpen(false);
        }
      }}
    >
      <Stack
        gap={theme.spacing(2)}
        color={theme.palette.text.secondary}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 450,
          bgcolor: theme.palette.background.modal,
          border: 1,
          borderColor: theme.palette.border.dark,
          borderRadius: theme.shape.borderRadius,
          boxShadow: 24,
          p: theme.spacing(15),
          "&:focus": {
            outline: "none",
          },
        }}
      >
        <Typography
          id="modal-risk-confirmation"
          fontSize={16}
          fontWeight={600}
        >
          Model has associated risks
        </Typography>
        <Typography
          id="risk-confirmation-message"
          fontSize={13}
          textAlign={"justify"}
        >
          This model has associated risks. What would you like to do with the risks when deleting this model?
        </Typography>
        <Stack
          direction="row"
          gap={theme.spacing(4)}
          mt={theme.spacing(12)}
          justifyContent="flex-end"
        >
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="text"
            color="inherit"
            onClick={handleCancel}
            sx={BasicModalCancelButtonStyle}
          >
            Cancel
          </Button>
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="outlined"
            color="primary"
            onClick={handleKeepRisks}
            sx={{
              ...BasicModalCancelButtonStyle,
              width: 120,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              "&:hover": {
                backgroundColor: theme.palette.primary.main + "0A",
                borderColor: theme.palette.primary.main,
              },
            }}
          >
            Keep risks
          </Button>
          <Button
            disableRipple
            disableFocusRipple
            disableTouchRipple
            variant="contained"
            color="error"
            onClick={handleDeleteRisks}
            sx={{
              ...BasicModalDeleteButtonStyle,
              width: 140,
            }}
          >
            Delete risks too
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

export default ModelRiskConfirmation;