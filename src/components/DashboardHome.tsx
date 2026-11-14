import React from 'react';

export const DashboardHome: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Operational Welcome Hero Card */}
      <section className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 px-6 py-7 sm:px-8 sm:py-9 shadow-xs">
        <div className="flex flex-col items-center justify-center text-center space-y-3.5 w-full mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-lg bg-[#4A2B18] text-white dark:bg-[#D4A373] dark:text-[#140D09] text-sm sm:text-base font-extrabold tracking-wide">
            PORTAL BANTUAN KERJA OPERASIONAL HS GROUP
          </span>

          <h1 className="text-xl sm:text-3xl lg:text-4xl xl:text-[40px] leading-tight font-extrabold tracking-tight text-black dark:text-white lg:whitespace-nowrap">
            SELAMAT DATANG &amp; SELAMAT MENGGUNAKAN
          </h1>

          <p className="text-sm sm:text-base font-bold tracking-wider text-[#6E3E20] dark:text-[#E5B874]">
            NAMANYA MANUSIA BOY | BUKAN NABI | NOBODY IS PERFECT
          </p>
        </div>
      </section>

      {/* Brand Banner Showcase */}
      <section className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-2 sm:p-3 shadow-xs overflow-hidden">
        <img
          src="https://ik.imagekit.io/donpablo69/donpablo69"
          alt="DON PABLO - Portal Bantuan Kerja Operasional HS Group"
          referrerPolicy="no-referrer"
          className="w-full h-auto object-cover rounded-xl block"
        />
      </section>
    </div>
  );
};
