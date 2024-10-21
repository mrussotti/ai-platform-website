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
      year: "Junior",
      bio: "Simran is passionate about machine learning, software development, and semiconductors, with a keen interest in solving complex technical challenges. Alongside her technical expertise, she enjoys puzzle-solving and writing fiction, bringing creativity to both her professional and personal pursuits."
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
          <div
            key={index}
            className="bg-gray-800 p-6 rounded-lg shadow-lg w-64 h-106 flex flex-col"  // Fixed height and width for consistency
          >
            {/* Consistent image size */}
            <img
              src={`${index + 1}.jpeg`}  // Reference your image files
              alt={`${member.name}'s profile`}
              className="w-full h-50 object-cover rounded-md mb-4"  // Ensures uniform image size
            />
            <h2 className="text-2xl font-semibold">{member.name}</h2>
            <p className="text-lg text-orange-400">{member.major}</p>
            <p className="text-md text-gray-400">{member.year}</p>
            
            {/* Scrollable bio with a fixed height */}
            <p className="text-sm text-gray-300 mt-3 overflow-y-auto h-20">
              {member.bio}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
  
}
