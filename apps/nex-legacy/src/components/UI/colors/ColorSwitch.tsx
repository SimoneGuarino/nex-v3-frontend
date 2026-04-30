import clsx from "clsx";
import FDIconButton from "../buttons/FDIconButton";
import { IoCloseSharp } from "react-icons/io5";

const CloseIcon = IoCloseSharp as React.FC<{ size?: number, className?: string }>;

type ColorType = "title" | "subtitle" | "text";

export type ColorOption = {
    main: string;
    type: Record<ColorType, string>;
    icon?: string; // optional for icons
};

const defaultColorOptions: ColorOption[] = [
    {
        main: 'bg-gray-100 dark:bg-gray-300',
        icon: 'bg-gray-400',
        type: {
            title: 'text-gray-800',
            subtitle: 'text-gray-700',
            text: 'text-gray-900',
        }
    },
    {
        main: "bg-indigo-100 dark:bg-indigo-300",
        icon: 'bg-indigo-400',
        type: {
            title: "text-indigo-800",
            subtitle: "text-indigo-700",
            text: "text-indigo-900",
        }
    },
    {
        main: "bg-blue-100 dark:bg-blue-300",
        icon: 'bg-blue-400',
        type: {
            title: "text-blue-800",
            subtitle: "text-blue-700",
            text: "text-blue-800",
        }
    },
    {
        main: "bg-teal-100 dark:bg-teal-300",
        icon: 'bg-teal-400',
        type: {
            title: "text-teal-800",
            subtitle: "text-teal-700",
            text: "text-teal-900",
        }
    },
    {
        main: "bg-green-100 dark:bg-green-300",
        icon: 'bg-green-400',
        type: {
            title: "text-green-800",
            subtitle: "text-green-700",
            text: "text-green-900",
        }
    },
    {
        main: "bg-lime-100 dark:bg-lime-300",
        icon: 'bg-lime-400',
        type: {
            title: "text-lime-800",
            subtitle: "text-lime-700",
            text: "text-lime-900",
        }
    },
    {
        main: "bg-yellow-100 dark:bg-yellow-300",
        icon: 'bg-yellow-400',
        type: {
            title: "text-yellow-800",
            subtitle: "text-yellow-700",
            text: "text-yellow-900",
        }
    },
    {
        main: "bg-orange-100 dark:bg-orange-300",
        icon: 'bg-orange-400',
        type: {
            title: "text-orange-800",
            subtitle: "text-orange-700",
            text: "text-orange-900",
        }
    },
    {
        main: "bg-red-100 dark:bg-red-300",
        icon: 'bg-red-400',
        type: {
            title: "text-red-800",
            subtitle: "text-red-700",
            text: "text-red-900",
        }
    },
    {
        main: "bg-pink-100 dark:bg-pink-300",
        icon: 'bg-pink-400',
        type: {
            title: "text-pink-800",
            subtitle: "text-pink-700",
            text: "text-pink-900",
        }
    },
    {
        main: "bg-purple-100 dark:bg-purple-300",
        icon: 'bg-purple-400',
        type: {
            title: "text-purple-800",
            subtitle: "text-purple-700",
            text: "text-purple-900",
        }
    }
];

export default function ColorSwitch({
    selectedColor,
    onChange,
    colorOptions,
    width = "5",
    height = "5"
}: {
    selectedColor: string | null | undefined;
    onChange: (color: ColorOption | null) => void;
    colorOptions?: ColorOption[];
    width?: string;
    height?: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <FDIconButton
                size="small"
                icon={<CloseIcon size={20} className='text-red-500' />}
                onClick={() => onChange(null)}
            />
            {(colorOptions || defaultColorOptions).map((color: ColorOption) => (
                <button
                    key={color.main}
                    type="button"
                    onClick={() => onChange(color)}
                    className={clsx(
                        `w-${width} h-${height} rounded-full flex-shrink-0`,
                        "transition-transform duration-200 hover:scale-110 cursor-pointer",
                        (color.icon || color.main), color.type.text, color.type.title, color.type.subtitle,
                        (selectedColor && selectedColor === color.main) && "ring-2 ring-offset-2 ring-violet-500"
                    )}
                />
            ))}
        </div>
    );
}