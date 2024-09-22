import HeroSection from "../components/HeroSection"
import React, { useEffect } from 'react'

export default function Home(){
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <HeroSection/>
    )
}