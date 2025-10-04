export const styles = {
  btnWrap: {
    marginTop: 'auto',
    paddingTop: 12,
    display: "flex",
    alignItems: "flex-end",
  },
  CustomizableButton: {
    width: { xs: "100%", sm: 160 },
    backgroundColor: "#1769AB",
    color: "#fff",
    border: "1px solid #1769AB",
    gap: 2,
  },
  titleText: {
    fontSize: 16,
    color: "#344054",
    fontWeight: "bold",
  },
  baseText: {
    color: "#344054",
    fontSize: 13,
  },
};

export const fieldStyle = (theme: any) => ({
  fontWeight: "bold",
  backgroundColor: theme.palette.background.main,
  "& input": {
    padding: "0 14px",
  },
});

export const selectReportStyle = (theme: any) => ({
  width: "100%",
  backgroundColor: theme.palette.background.main,
});
