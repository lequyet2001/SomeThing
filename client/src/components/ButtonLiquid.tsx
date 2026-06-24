

type Props = {
  isSubmitting?: boolean;
  t: string;
  onClick?: () => void;
};

const ButtonLiquid = ({ isSubmitting, t, onClick }: Props) => {
    return (
        
        <button
          onClick={onClick}
          disabled={isSubmitting}
          className="group relative w-full block box-border px-12 py-4 bg-blue-50 uppercase overflow-hidden rounded-2xl before:content-[''] after:content-[''] before:absolute after:absolute before:z-50 after:z-50 before:bg-white/90 after:bg-white/90 before:w-4 before:h-6 before:left-2 before:bottom-2 before:rounded-[32%_68%_40%_60%] before:transition-all before:delay-100 before:duration-500 before:hover:-translate-x-0.5 before:hover:translate-y-0.5 before:hover:bg-white/40 after:w-1.5 after:h-1.5 after:rounded-[50%] after:bottom-9 after:left-3 after:transition-all after:delay-100 after:duration-500 after:hover:-translate-x-1 after:hover:translate-y-1 after:hover:bg-white/40 active:translate-y-1 before:active:duration-1000 before:active:translate-x-32 before:active:rounded-[68%_32%_60%_40%] after:active:duration-1000 after:active:translate-x-32"
          style={{ boxShadow: "inset 5px 5px 15px rgba(0,0,0,0.1), 7px 10px 10px rgba(0,0,0,0.1), 7px 10px 10px rgba(0,0,0,0.1), inset -5px -5px 15px rgba(255,255,255,0.5)" }}
        >
          <span 
          style={{ textShadow: "0 0 5px rgba(255,255,255,0.5)" }}
          className="relative font-bold text-primaryDark text-base tracking-wide text-center  transition-all duration-300 ease-in-out group-hover:text-white z-40 group-hover:drop-shadow">
            {t}
          </span>
          <div className="absolute -left-1/2 top-0 z-10 w-14 h-14 rounded-full bg-blue-500 transition-all duration-300 delay-100 ease-in group-hover:w-full group-hover:h-36 group-hover:-left-1/4 group-hover:-top-1/2"></div>
          <div className="absolute -right-1/2 top-0 z-10 w-14 h-14 rounded-full bg-blue-500 transition-all duration-300 delay-100 ease-in group-hover:w-full group-hover:h-36 group-hover:-right-1/4 group-hover:-top-1/2"></div>
          <div className="absolute box-border -top-20 left-0 z-20 w-full h-full bg-red-500 shadow-[inset_0_0_50px] shadow-white/50 before:content-[''] after:content-[''] before:absolute after:absolute before:h-[200%] after:h-[200%] before:w-[200%] after:w-[200%] before:top-0 after:top-0 before:left-1/2 after:left-1/2 before:-translate-x-1/2 after:-translate-x-1/2 before:-translate-y-3/4 after:-translate-y-3/4 before:rounded-[45%] after:rounded-[40%] before:bg-[20_20_20_1] after:bg-[20_20_20_0.5] before:z-50 after:z-50"></div>
        </button>
    );
}

export default ButtonLiquid;
