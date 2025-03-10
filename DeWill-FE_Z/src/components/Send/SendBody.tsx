import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { ethers } from "ethers";
import {
    CssBaseline,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    SelectChangeEvent,
} from "@mui/material";
import { CONTRACT_ADDRESS, Will, RecipientDetails } from "../DeWill/DeWillBody";
import CONTRACT_ABI from '../../assets/abi.json';
import emailjs from '@emailjs/browser';

interface Errors {
    recipient?: string;
    percentage?: string;
    email?: string;
    cause?: string;
    timestamp?: string;
}

enum Cause {
    BirthdayGift = "Birthday Gift",
    AssetTransfer = "Asset Transfer to Heir",
    OccasionalTransfer = "Occasional Transfer",
}

const generateAIEmail = (recipient: string, cause: string, percentage: string, code: string): string => {
    return `Dear ${recipient},\n\nI hope this message finds you well. I’m pleased to inform you that I’m transferring ${percentage}% as a ${cause}. To redeem your funds, please go to http://localhost:5173/redeem and use the following code: ${code}. This transfer is a special gesture, and I hope it brings you joy.\n\nBest regards,\nNed Stark`;
};

const SendBody = () => {
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [balance, setBalance] = useState<string>("-1");
    const [willDetails, setWillDetails] = useState<Will>({
        text: "",
        stakingInterest: false,
        totalPercentage: 0,
        error: "",
        recipients: []
    });
    const [recipient, setRecipient] = useState<string>("");
    const [percentage, setPercentage] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [cause, setCause] = useState<string>("");
    const [timestamp, setTimestamp] = useState<string>("");
    const [errors, setErrors] = useState<Errors>({});

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const bal = await getBalance();
                setBalance(bal);
            } catch (err) {
                console.error("Balance fetch failed:", err);
            }
        };
        fetchBalance();
        checkExistingWill();
    }, []);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleChange = (
        field: "recipient" | "percentage" | "email" | "cause" | "timestamp"
    ) => (
        event: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const value = event.target.value;
        if (field === "recipient") setRecipient(value);
        else if (field === "percentage") setPercentage(value);
        else if (field === "email") setEmail(value);
        else if (field === "cause") setCause(value);
        else if (field === "timestamp") setTimestamp(value);
        setErrors({ ...errors, [field]: "" });
    };

    const validateForm = (): boolean => {
        const newErrors: Errors = {};
        if (!recipient) newErrors.recipient = "Recipient is required";
        if (!percentage) {
            newErrors.percentage = "Percentage is required";
        } else {
            const percent = Number(percentage);
            if (percent < 1 || percent > 100) {
                newErrors.percentage = "Percentage must be between 1 and 100";
            }
        }
        if (!cause) newErrors.cause = "Cause of transfer is required";
        if (!timestamp) {
            newErrors.timestamp = "Timestamp is required";
        } else {
            const ts = new Date(timestamp).getTime() / 1000;
            if (isNaN(ts) || ts < Math.floor(Date.now() / 1000)) {
                newErrors.timestamp = "Timestamp must be a valid future date";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    async function getBalance(): Promise<string> {
        if (!window.ethereum) {
            alert("MetaMask not installed!");
            return "-1";
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const balance = await provider.getBalance(signer.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error("Fetch balance failed:", error);
            return "-1";
        }
    }

    const checkExistingWill = async () => {
        if (!window.ethereum) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS.sonic, CONTRACT_ABI, signer);
            const recipients = await contract.getRecipients();
            const will: Will = await contract.getWill();

            if (recipients && recipients.length > 0) {
                const formattedRecipients: RecipientDetails[] = recipients.map((r: any) => ({
                    addr: r.addr,
                    firstName: r.firstName,
                    lastName: r.lastName,
                    primaryEmail: r.primaryEmail,
                    secondaryEmail: r.secondaryEmail || "",
                    currency: r.currency,
                    country: ["India", "United States", "United Kingdom", "Japan", "Canada", "Australia", "China", "Russia", "Switzerland", "EU"][r.country] || "India",
                    age: Number(r.age),
                    gender: ["Male", "Female", "Others"][r.gender] || "Male",
                    percentage: Number(r.percentage),
                }));
                setWillDetails({
                    ...willDetails,
                    recipients: formattedRecipients,
                    totalPercentage: formattedRecipients.reduce((sum, r) => sum + r.percentage, 0),
                    stakingInterest: await contract.getStaking(),
                    text: will.text
                });
            }
        } catch (error) {
            console.error("Failed to fetch will:", error);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) {
            console.error("Form validation failed:", errors);
            return;
        }
        if (!window.ethereum) {
            alert("MetaMask not installed!");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const wallet = await signer.getAddress();
            console.log("Signer:", wallet);

            const contract = new ethers.Contract(CONTRACT_ADDRESS.sonic, CONTRACT_ABI, signer);
            const selectedRecipient = willDetails.recipients.find(
                r => `${r.firstName} ${r.lastName}` === recipient
            );

            if (!selectedRecipient?.primaryEmail) {
                setErrors({ ...errors, recipient: "No email found for this recipient" });
                return;
            }

            const blockchainTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);
            const redemptionCode = `RECIPIENT_${selectedRecipient.addr.slice(0, 6)}`;
            const txRequest = await contract.addRequest(
                selectedRecipient.primaryEmail,
                redemptionCode,
                Number(percentage),
                cause,
                blockchainTimestamp,
                { gasLimit: 100000 }
            );
            console.log(`Request Tx Hash for ${selectedRecipient.addr}:`, txRequest.hash);
            await txRequest.wait();
            console.log(`Request confirmed for ${selectedRecipient.addr}!`);

            const serviceID = 'dewill';
            const templateID = 'dewill_template';
            const publicKey = 'utY0W0EPIytoPwfRZ';

            const emailBody = email
                ? `${email}\n\nTo redeem your funds, use this code: ${redemptionCode} at http://localhost:5173/redeem`
                : generateAIEmail(recipient, cause, percentage, redemptionCode);

            const emailParams = {
                to_email: selectedRecipient.primaryEmail,
                to_name: recipient,
                message: emailBody,
                from_name: "Ned Stark",
            };

            const response = await emailjs.send(serviceID, templateID, emailParams, publicKey);
            console.log("Email sent successfully:", response);

            setRecipient("");
            setPercentage("");
            setEmail("");
            setCause("");
            setTimestamp("");
            setErrors({});
        } catch (error) {
            console.error("Email sending or request addition failed:", error);
            setErrors({ ...errors, email: "Failed to send email or add request" });
        }
    };

    const handleGenerateAIEmail = () => {
        if (!recipient || !percentage || !cause || !timestamp) {
            setErrors({
                ...errors,
                email: "Please fill all fields before generating an email",
            });
            return;
        }
        const selectedRecipient = willDetails.recipients.find(
            r => `${r.firstName} ${r.lastName}` === recipient
        );
        const redemptionCode = selectedRecipient ? `RECIPIENT_${selectedRecipient.addr.slice(0, 6)}` : "UNKNOWN_CODE";
        const aiEmail = generateAIEmail(recipient, cause, percentage, redemptionCode);
        setEmail(aiEmail);
        setErrors({ ...errors, email: "" });
    };

    return (
        <div>
            <CssBaseline />
            <Box
                sx={{
                    bgcolor: "#000000",
                    height: "100vh",
                    width: "100vw",
                    margin: 0,
                    padding: 0,
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
                onMouseMove={handleMouseMove}
            >
                <Box
                    sx={{
                        position: "absolute",
                        width: "40px",
                        height: "40px",
                        bgcolor: "rgba(255, 255, 255, 0.05)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                        transform: "translate(-50%, -50%)",
                        left: mousePosition.x,
                        top: mousePosition.y,
                        boxShadow: "0 0 20px 10px rgba(255, 255, 255, 0.15)",
                        zIndex: 1,
                    }}
                />
                <Container
                    maxWidth="lg"
                    sx={{
                        position: "relative",
                        zIndex: 2,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        py: 2,
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            color: "white",
                            position: "absolute",
                            top: 10,
                            right: 10,
                            fontFamily: "Roboto, sans-serif",
                        }}
                    >
                        Balance: {balance}
                    </Typography>

                    <Typography
                        variant="h2"
                        sx={{
                            color: "white",
                            textAlign: "center",
                            py: "60px",
                            fontFamily: "Calligraffitti, Creepster, Roboto, sans-serif",
                            fontWeight: "bold",
                            textTransform: "uppercase",
                            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)",
                            lineHeight: 1.2,
                            letterSpacing: "0.05em",
                        }}
                    >
                        DeWill
                    </Typography>

                    {willDetails.recipients.length > 0 ? (
                        <Box
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{
                                bgcolor: "rgba(255, 255, 255, 0.05)",
                                p: 2,
                                borderRadius: 2,
                                maxWidth: "600px",
                                mx: "auto",
                                flex: 1,
                                overflowY: "auto",
                            }}
                        >
                            <Grid container spacing={1}>
                                <Grid item xs={12}>
                                    <FormControl fullWidth error={!!errors.recipient}>
                                        <InputLabel sx={{ color: "white" }}>Recipient</InputLabel>
                                        <Select
                                            value={recipient}
                                            onChange={handleChange("recipient")}
                                            sx={{
                                                color: "white",
                                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                                            }}
                                            label="Recipient"
                                        >
                                            {willDetails.recipients.map((r) => (
                                                <MenuItem
                                                    key={r.addr}
                                                    value={`${r.firstName} ${r.lastName}`}
                                                    sx={{ color: "white", bgcolor: "black" }}
                                                >
                                                    {r.firstName} {r.lastName}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.recipient && (
                                            <Typography color="error" variant="caption">
                                                {errors.recipient}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Percentage"
                                        type="number"
                                        value={percentage}
                                        onChange={handleChange("percentage")}
                                        slotProps={{
                                            input: {
                                                endAdornment: <span style={{ color: "white" }}>%</span>,
                                                sx: { color: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                                            },
                                        }}
                                        sx={{ label: { color: "white" } }}
                                        error={!!errors.percentage}
                                        helperText={errors.percentage}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth error={!!errors.cause}>
                                        <InputLabel sx={{ color: "white" }}>Cause of Transfer</InputLabel>
                                        <Select
                                            value={cause}
                                            onChange={handleChange("cause")}
                                            sx={{
                                                color: "white",
                                                bgcolor: "rgba(255, 255, 255, 0.1)",
                                                "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
                                            }}
                                            label="Cause of Transfer"
                                        >
                                            {Object.values(Cause).map((cause) => (
                                                <MenuItem
                                                    key={cause}
                                                    value={cause}
                                                    sx={{ color: "white", bgcolor: "black" }}
                                                >
                                                    {cause}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.cause && (
                                            <Typography color="error" variant="caption">
                                                {errors.cause}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Redemption Timestamp"
                                        type="datetime-local"
                                        value={timestamp}
                                        onChange={handleChange("timestamp")}
                                        slotProps={{
                                            input: {
                                                sx: { color: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                                            },
                                        }}
                                        sx={{ label: { color: "white" } }}
                                        error={!!errors.timestamp}
                                        helperText={errors.timestamp}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email Body"
                                        multiline
                                        rows={3}
                                        value={email}
                                        onChange={handleChange("email")}
                                        slotProps={{
                                            input: {
                                                sx: { color: "white", bgcolor: "rgba(255, 255, 255, 0.1)" },
                                            },
                                        }}
                                        sx={{ label: { color: "white" } }}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                    />
                                </Grid>

                                <Grid item xs={12} sx={{ textAlign: "center" }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleGenerateAIEmail}
                                        sx={{
                                            color: "white",
                                            borderColor: "white",
                                            "&:hover": { borderColor: "grey.300", bgcolor: "rgba(255, 255, 255, 0.1)" },
                                            mb: 1,
                                        }}
                                    >
                                        Generate Email by AI
                                    </Button>
                                </Grid>

                                <Grid item xs={12} sx={{ textAlign: "center" }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        sx={{
                                            bgcolor: "white",
                                            color: "#000000",
                                            "&:hover": { bgcolor: "grey.300" },
                                            px: 4,
                                            py: 1,
                                            fontWeight: "bold",
                                        }}
                                    >
                                        Submit
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    ) : (
                        <Typography
                            variant="body1"
                            sx={{ color: "white", textAlign: "center", flex: 1 }}
                        >
                            No recipients found in the existing will.
                        </Typography>
                    )}
                </Container>
            </Box>
        </div>
    );
};

export default SendBody;