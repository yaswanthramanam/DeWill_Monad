import React, { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { CssBaseline, Typography } from "@mui/material";

function Body() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    return (
        <div>
            <CssBaseline />
            <Box
                sx={{
                    bgcolor: '#000000', // Dark grey, professional
                    minHeight: '100vh',
                    width: '100vw',
                    margin: '0',
                    padding: '0',
                    position: 'relative',
                    overflow: 'hidden', // Prevent scroll
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onMouseMove={handleMouseMove}
            >
                {/* Cursor shadow */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '40px',
                        height: '40px',
                        bgcolor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                        left: `${mousePosition.x}px`,
                        top: `${mousePosition.y}px`,
                        boxShadow: '0 0 20px 10px rgba(255, 255, 255, 0.15)',
                        zIndex: 1,
                    }}
                />
                <Container maxWidth="lg">
                    <Typography
                        variant="h2"
                        sx={{ 
                            color: 'white',
                            textAlign: 'center',
                            position: 'relative',
                            zIndex: 2,
                            py: 3 ,
                            fontFamily: 'Calligraffitti, Creepster, Roboto, sans-serif',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
                            lineHeight: 1.2,
                            letterSpacing: '0.05em' // Slight spacing for effect
                        }} 
                    >
                        DeWill
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{ 
                            color: 'white',
                            textAlign: 'center',
                            position: 'relative',
                            zIndex: 2,
                            fontFamily: 'Calligraffitti, Creepster, Roboto, sans-serif',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
                            lineHeight: 1.2,
                            letterSpacing: '0.05em' // Slight spacing for effect
                        }} 
                    >
                        A Decentralized Will for Lost Assets
                    </Typography>
                </Container>
            </Box>
        </div>
    );
}

export default Body;