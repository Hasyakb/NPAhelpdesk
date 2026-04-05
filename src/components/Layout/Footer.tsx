import React from 'react';
import { Shield, Building2, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-white/5 mt-20 transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center border border-gray-100 dark:border-white/10 p-1">
                <img 
                  src="https://tse1.mm.bing.net/th/id/OIP.0_ZWomuVeU5KH9T5iRSr8gAAAA?rs=1&pid=ImgDetMain&o=7&rm=3" 
                  alt="NPA Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-bold text-npa-green dark:text-white tracking-tight">Nigerian Ports Authority</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
              The ICT Service Portal is the official platform for personnel of the Nigerian Ports Authority to request technical assistance, report infrastructure issues, and access digital resources.
            </p>
            <div className="flex items-center gap-4 text-gray-400 dark:text-gray-600">
              <Shield className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-widest">Official Government Portal</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Support Channels</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 text-npa-green" />
                <span>ICT Help Desk: Ext. 4000</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 text-npa-green" />
                <span>support@nigerianports.gov.ng</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Building2 className="w-4 h-4 text-npa-green" />
                <span>Headquarters, Marina, Lagos</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Legal & Privacy</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-npa-green dark:hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-npa-green dark:hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-npa-green dark:hover:text-white transition-colors">Information Security Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-50 dark:border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            © 2026 Nigerian Ports Authority. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-tighter">Version 2.4.0-Official</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-tighter">Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
