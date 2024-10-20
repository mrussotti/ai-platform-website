import HeroSection from "../components/HeroSection"
import DataFetcher from "../components/DataFetcher"
import React, { useEffect } from 'react'

const dbName = 'db1';

export default function Home() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <HeroSection />
            <DataFetcher dbname={dbName} />
        </>
    )
}