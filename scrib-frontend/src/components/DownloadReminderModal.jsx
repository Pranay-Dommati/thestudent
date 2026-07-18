import React from 'react'

const DownloadReminderModal = ({ onShare, onDownload, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm transition-all duration-300">
      <div 
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-[#e2dbd2] transform scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fef3c7]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#d97706]">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1f1f1f]">Wait! Earn Free Credits</h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-[#9a9289] hover:bg-[#f5f2ec] hover:text-[#1f1f1f] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <p className="text-sm text-[#5a554f] mb-6 leading-relaxed">
          Instead of downloading and sending the PDF to your friends, share a direct link with them! 
          <br/><br/>
          You will earn <strong className="text-[#1f1f1f] font-bold">0.5 credits</strong> for every page they unlock using your link.
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              onClose()
              onShare()
            }}
            className="w-full rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Share Link Instead
          </button>
          <button 
            onClick={() => {
              onClose()
              onDownload()
            }}
            className="w-full rounded-xl bg-transparent border border-[#e2dbd2] px-4 py-2.5 text-sm font-semibold text-[#5a554f] hover:bg-[#f7f4ee] transition-colors"
          >
            Continue Download
          </button>
        </div>
      </div>
    </div>
  )
}

export default DownloadReminderModal
