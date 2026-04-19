'use client';

import { useState } from 'react';
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
  ChevronDownIcon,
  ArrowLeftRightIcon,
  LogOutIcon } from
'lucide-react';
import { displayInitials } from '../../lib/displayInitials';
interface TopBarProps {
  onMenuClick: () => void;
  pageTitle: string;
  onSwitchToMember?: () => void;
  onLogout?: () => void;
  currentUser?: {
    name: string;
    roleLabel: string;
  };
}
export function TopBar({
  onMenuClick,
  pageTitle,
  onSwitchToMember,
  onLogout,
  currentUser
}: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  return (
    <header className="h-16 bg-white border-b border-fountain-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 md:hidden text-fountain-gray-600 hover:text-fountain-gray-900">
          
          <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-fountain-gray-900 hidden sm:block">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center space-x-4 lg:space-x-6">
        <div className="hidden md:flex items-center relative">
          <SearchIcon className="w-4 h-4 text-fountain-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search members, loans..."
            className="pl-9 pr-4 py-2 bg-fountain-gray-50 border border-fountain-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fountain-blue/50 focus:border-fountain-blue w-64 transition-all" />
          
        </div>

        {onSwitchToMember &&
        <button
          onClick={onSwitchToMember}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-fountain-blue/10 text-fountain-blue rounded-lg text-xs font-medium hover:bg-fountain-blue/20 transition-colors"
          title="Preview Member App">
          
            <ArrowLeftRightIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Member View</span>
          </button>
        }

        <button className="relative text-fountain-gray-600 hover:text-fountain-gray-900">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-fountain-red rounded-full border-2 border-white"></span>
        </button>

        <div className="relative">
          <div
            className="flex items-center space-x-3 cursor-pointer pl-4 border-l border-fountain-gray-200"
            onClick={() => setIsProfileOpen(!isProfileOpen)}>
            
                       <div className="w-9 h-9 rounded-full bg-fountain-blue text-white flex items-center justify-center font-bold text-sm">
              {currentUser
                ? displayInitials(currentUser.name)
                : 'AO'}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-fountain-gray-900">
                {currentUser?.name ?? 'Adebayo Ogundimu'}
              </p>
              <p className="text-xs text-fountain-gray-600">
                {currentUser?.roleLabel ?? 'Super Admin'}
              </p>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-fountain-gray-400 hidden lg:block" />
          </div>

          {isProfileOpen && onLogout &&
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-fountain-gray-200 py-1 z-50">
              <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-fountain-red hover:bg-fountain-red/5 transition-colors">
              
                <LogOutIcon className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          }
        </div>
      </div>
    </header>);

}