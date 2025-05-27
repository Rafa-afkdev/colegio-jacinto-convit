import Image from "next/image";
import { ProfileDropdown } from "./profile-dropdown";
import React from "react";

const NavBar = () => {
    return (
        <div className="flex justify-between mx-6 mb-10 lg:max-20 py-6 border-b border-solid border-gray-200 md:border-b-0">
            <Image
        src="/Logo.png"
        alt="Logo"
        width={75}
        height={50}
        className="object-cover"
        priority
      />
      <div className="md:mr-10">
      <ProfileDropdown/>
      </div>
        </div>
     );
}
export default NavBar ;