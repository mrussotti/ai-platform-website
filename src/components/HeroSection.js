import React from 'react';
import styles from './HeroSection.module.css'; 
import osuImage from '../assets/osu.jpg'; 
import { useNavigate } from 'react-router-dom';

function HeroSection() {
  const navigate = useNavigate();

  const handleOnclick = () => {
    console.log('Get Started button')
    navigate('/querypage');
  }

  return (
    <div className={styles.heroContainer}>
      <h1 className={styles.heroTitle} >Welcome to the AI Platform Website!!!</h1>
      <img src={osuImage} alt="OSU" className={styles.heroImage} />
      <p className={styles.heroSubtitle}>Your gateway to advanced AI solutions</p>
      <button onClick={handleOnclick} className={styles.heroButton}>Get Started</button>
    </div>
  );
}

export default HeroSection;
