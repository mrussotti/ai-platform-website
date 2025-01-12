import React from 'react';

export default function Team() {
  const teamMembers = [
    {
      name: "Dr. Rajiv Ramnath",
      major: "Electrical Engineering",
      year: "Professional Practice Professor, Computer Science and Engineering",
      bio: "Dr. Ramnath is a Professor of Practice in Computer Science and Engineering at The Ohio State University. I extensively collaborate with industry and other departments on research, education and workforce programs, and teach several industry-relevant courses."
    },
    {
      name: "Matt Russotti",
      major: "Computer and Information Science",
      year: "2024 Alum",
      bio: "Weightlifting enthusiast, 3D printing hobbyist, and tabletop gaming fan."
    },
    {
      name: "Sakshi Shashiraj",
      major: "Computer Science and Engineering",
      year: "Senior",
      bio: "Sakshi Shashiraj is a passionate software engineering student interested in technology, coding, and empowering others through mentorship and community engagement."
    },

    {
      name: "Noelle Lin",
      major: "Computer Science and Engineering",
      year: "Senior",
      bio: "Info about noelle."
    },

    {
      name: "Simran Meena",
      major: "Electrical Engineering",
      year: "Junior at IIT Delhi",
      bio: "I’m an Electrical Engineering student at IIT Delhi with an interest in technology and problem-solving. I enjoy working on projects related to development, open-source contributions, and machine learning. I focus on learning through hands-on experience and enjoy building things that make an impact."
    },
    {
      name: "Bhabatosh Senapati",
      major: "Masters in Computer Science and Engineering",
      year: "Final Year",
      bio: "I've honed my skills at Niv-Tech Solutions, where I led API and SSO projects, enhancing system synchronization and security. Transitioning from Mechanical Engineering to CS, I specialize in AI and ML. Aspiring to innovate in Software Engineering as a Full-Stack Developer."
    },

  ];

  return (
    <div className="bg-black text-white min-h-screen">
      <h1 className="text-center text-4xl font-bold py-10">Meet the Team</h1>
      <div className="flex justify-center items-center flex-wrap gap-8 px-10">
        {teamMembers.map((member, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-lg w-64">
            <img 
              src="https://via.placeholder.com/150" 
              alt={`${member.name}'s profile`} 
              className="w-full h-40 object-cover rounded-md mb-4" 
            />
            <h2 className="text-2xl font-semibold">{member.name}</h2>
            <p className="text-lg text-orange-400">{member.major}</p>
            <p className="text-md text-gray-400">{member.year}</p>
            <p className="text-sm text-gray-300 mt-3">{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
