import React from 'react';

const OncaLogo = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-md bg-black ${className}`}>
      <img
        src="/fiscaliza-onca-investigadora.png"
        alt="FISCALIZA"
        className="h-full w-full scale-125 object-cover"
      />
    </div>
  );
};

export default OncaLogo;
