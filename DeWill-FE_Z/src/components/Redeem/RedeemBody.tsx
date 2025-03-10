import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import {
    CssBaseline,
    Typography,
    TextField,
    Button,
    Grid,
} from "@mui/material";
import { CONTRACT_ADDRESS } from "../DeWill/DeWillBody";
import CONTRACT_ABI from '../../assets/abi.json';

interface FormData {
    email: string;
    code: string;
}

interface Errors {
    email?: string;
    code?: string;
}

interface Request {
    email: string;
    code: string;
    percentage: string;
    reason: string;
    timestamp: string;
}

const Redeem: React.FC = () => {
    const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({ email: "", code: "" });
    const [errors, setErrors] = useState<Errors>({});
    const [walletBalance, setWalletBalance] = useState<string>("-1");
    const [contractBalance, setContractBalance] = useState<string>("-1");

    useEffect(() => {
        connectWallet();
    }, []);

    useEffect(() => {
        let mounted = true;
        updateBalances().then(() => {
            if (mounted) {
            }
        });
        return () => {
            mounted = false;
        };
    }, []);

    async function updateBalances(): Promise<void> {
        try {
            const walletBal = await getWalletBalance();
            const contractBal = await getContractBalance();
            setWalletBalance(walletBal);
            setContractBalance(contractBal);
        } catch (error) {
            console.error("Failed to update balances:", error);
        }
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleChange = (field: keyof FormData) => (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [field]: event.target.value });
        setErrors({ ...errors, [field]: "" });
    };

    const validateForm = (): boolean => {
        const newErrors: Errors = {};
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }
        if (!formData.code) newErrors.code = "Code is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("MetaMask not installed!");
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setWalletAddress(address);
            await updateBalances(); // Update balances after connecting
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) {
            console.error("Form validation failed:", errors);
            return;
        }
        if (!walletAddress) {
            setErrors({ ...errors, email: "Please connect your wallet first" });
            return;
        }
        if (!window.ethereum) {
            alert("MetaMask not installed!");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS.sonic, CONTRACT_ABI, signer);

            const requests: Request[] = await contract.getRequests(walletAddress);
            console.log("Fetched requests:", requests);

            const matchedRequest:Request | undefined = requests.find(
                (req: Request) => req.email === formData.email && req.code === formData.code
            );

            console.log(matchedRequest);


            if (matchedRequest) {
                if (parseInt(matchedRequest.timestamp) >= Math.floor(Date.now() / 1000)) {
                    await withdrawFundsByPercentage(matchedRequest.percentage);
                    setErrors({});
                    console.log("Request matched and funds withdrawn:", matchedRequest);
                } else {
                    setErrors({ ...errors, code: "Request has expired" });
                }
                contract.deleteRequests(signer.getAddress, matchedRequest.email, matchedRequest.code);
            } else {
                setErrors({ ...errors, code: "No matching request found for this email and code" });
            }
            
        } catch (error) {
            console.error("Failed to verify request:", error);
            setErrors({ ...errors, code: "Error verifying request. Check console for details." });
        }
    };

    // async function _withdrawAllFunds(): Promise<void> {
    //     if (!window.ethereum) {
    //         console.log("MetaMask not installed!");
    //         return;
    //     }
    //     try {
    //         const provider = new ethers.BrowserProvider(window.ethereum);
    //         await provider.send("eth_requestAccounts", []);
    //         const signer = await provider.getSigner();
    //         const wallet = await signer.getAddress();
    //         console.log("Signer:", wallet);

    //         const contract = new ethers.Contract(CONTRACT_ADDRESS.electroneum, CONTRACT_ABI, signer);

    //         const fullBalanceWei = await contract.getBalance(3);
    //         if (fullBalanceWei <= 0n) {
    //             console.log("No funds available to withdraw.");
    //             setErrors({ ...errors, code: "No funds available to withdraw" });
    //             return;
    //         }

    //         const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits("20", "gwei");
    //         const gasLimit = BigInt(50000);
    //         const gasCost = gasPrice * gasLimit;

    //         if (fullBalanceWei <= gasCost) {
    //             console.log("Insufficient balance to cover gas fees.");
    //             setErrors({ ...errors, code: "Insufficient balance to cover gas fees" });
    //             return;
    //         }

    //         const amountToWithdraw = fullBalanceWei - gasCost;

    //         console.log("full Balance: ", fullBalanceWei);
    //         console.log("gas cost: ", gasCost);
    //         console.log("amountToWithdraw: ", amountToWithdraw);

    //         const tx = await contract.withdrawBalance(3, amountToWithdraw, {
    //             gasLimit: 50000,
    //         });
    //         console.log("Withdraw transaction sent:", tx.hash);
    //         await tx.wait();
    //         console.log("Withdraw transaction confirmed!");

    //         // Update balances after successful withdrawal
    //         const newContractBalance = await getContractBalance();
    //         const newWalletBalance = await getWalletBalance();
    //         setContractBalance(newContractBalance);
    //         setWalletBalance(newWalletBalance);
    //         console.log(`Successfully withdrew ${ethers.formatEther(amountToWithdraw)} ETH`);

    //         // await contract.optOut();
    //     } catch (error: any) {
    //         console.error("Withdraw all funds failed:", error);
    //         setErrors({ ...errors, code: `Failed to withdraw funds: ${error.message || "Unknown error"}` });
    //         throw error; // Re-throw to handle in handleSubmit if needed
    //     }
    // }

    async function withdrawFundsByPercentage(percentage:string): Promise<void> {
        if (!window.ethereum) {
            console.log("MetaMask not installed!");
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const wallet = await signer.getAddress();
            console.log("Signer:", wallet);

            const contract = new ethers.Contract(CONTRACT_ADDRESS.sonic, CONTRACT_ABI, signer);

            let fullBalanceWei = await contract.getBalance(3);
            fullBalanceWei = (BigInt(percentage) * fullBalanceWei) / BigInt(100);
            if (fullBalanceWei <= 0n) {
                console.log("No funds available to withdraw.");
                setErrors({ ...errors, code: "No funds available to withdraw" });
                return;
            }

            const gasPrice = (await provider.getFeeData()).gasPrice || ethers.parseUnits("20", "gwei");
            const gasLimit = BigInt(50000);
            const gasCost = gasPrice * gasLimit;

            if (fullBalanceWei <= gasCost) {
                console.log("Insufficient balance to cover gas fees.");
                setErrors({ ...errors, code: "Insufficient balance to cover gas fees" });
                return;
            }

            const amountToWithdraw = fullBalanceWei - gasCost;

            console.log("full Balance: ", fullBalanceWei);
            console.log("gas cost: ", gasCost);
            console.log("amountToWithdraw: ", amountToWithdraw);

            const tx = await contract.withdrawBalance(3, amountToWithdraw, {
                gasLimit: 50000,
            });
            console.log("Withdraw transaction sent:", tx.hash);
            await tx.wait();
            console.log("Withdraw transaction confirmed!");

            // Update balances after successful withdrawal
            const newContractBalance = await getContractBalance();
            const newWalletBalance = await getWalletBalance();
            setContractBalance(newContractBalance);
            setWalletBalance(newWalletBalance);
            console.log(`Successfully withdrew ${ethers.formatEther(amountToWithdraw)} ETH`);

            if(parseInt(percentage)==100){
                await contract.optOut();
            }

            // await contract.optOut();
        } catch (error: any) {
            console.error("Withdraw all funds failed:", error);
            setErrors({ ...errors, code: `Failed to withdraw funds: ${error.message || "Unknown error"}` });
            throw error; // Re-throw to handle in handleSubmit if needed
        }
    }

    async function getWalletBalance(): Promise<string> {
        if (!window.ethereum) {
            return "-1";
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const balance = await provider.getBalance(signer.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error("Fetch wallet balance failed:", error);
            return "-1";
        }
    }

    async function getContractBalance(): Promise<string> {
        if (!window.ethereum) {
            return "-1";
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS.sonic, CONTRACT_ABI, signer);
            const balance = await contract.getBalance(3);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error("Fetch contract balance failed:", error);
            return "-1";
        }
    }

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
                    maxWidth="sm"
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
                        Redeem Request
                    </Typography>

                    {/* Display balances for debugging */}
                    <Typography sx={{ color: "white", textAlign: "center" }}>
                        Wallet Balance: {walletBalance} ETH
                    </Typography>
                    <Typography sx={{ color: "white", textAlign: "center", mb: 2 }}>
                        Contract Balance: {contractBalance} ETH
                    </Typography>

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{
                            bgcolor: "rgba(255, 255, 255, 0.05)",
                            p: 2,
                            borderRadius: 2,
                            maxWidth: "400px",
                            mx: "auto",
                            flex: 1,
                            overflowY: "auto",
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={formData.email}
                                    onChange={handleChange("email")}
                                    InputProps={{ sx: { color: "white", bgcolor: "rgba(255, 255, 255, 0.1)" } }}
                                    sx={{ label: { color: "white" } }}
                                    error={!!errors.email}
                                    helperText={errors.email}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Code"
                                    value={formData.code}
                                    onChange={handleChange("code")}
                                    InputProps={{ sx: { color: "white", bgcolor: "rgba(255, 255, 255, 0.1)" } }}
                                    sx={{ label: { color: "white" } }}
                                    error={!!errors.code}
                                    helperText={errors.code}
                                />
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
                                    Verify Request
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Container>
            </Box>
        </div>
    );
};

export default Redeem;