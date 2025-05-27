import React from 'react';
import { Menu } from 'lucide-react';

import { ProfileDropdown } from '../profile-dropdown';
import { SidebarRoutes } from '../SidebarRoutes/SidebarRoutes';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

export function NavBar() {
  return (
    <div className='flex items-center px-2 gap-x-4 md:px-6 justify-between w-full bg-background border-b h-20'>

      <div className='block xl:hidden'>
        <Sheet>
          <SheetTrigger className='flex items-center'>
            <Menu />
          </SheetTrigger>
          <SheetContent side={"left"}>
            <SidebarRoutes/>
          </SheetContent>
        </Sheet>
      </div>

      <div className='relative w-[300px]'>
        {/* <Input placeholder='Buscar...' className='rounded-lg pl-10' /> 
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          <Search className='h-5 w-5 text-gray-600' /> 
        </div> */}
      </div>

      <div className='flex gap-x-2 items-center'>
        <ProfileDropdown />
      </div>
    </div>
  );
}