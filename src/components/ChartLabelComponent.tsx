import { useEffect, useState } from "react";

const ChartLabelComponent = () => {
    const BADGES_LABEL = ['Default', 'Increase', 'Decrease'];
    const [screenTapValue, setScreenTapValue] = useState<number>(0);

    useEffect(() => {
        const chartArea = document.getElementById('chartArea');
        if (!chartArea) return;

        const handleTap = () => {
            setScreenTapValue(prevValue => (prevValue + 1) % 3);
        };

        chartArea.addEventListener('click', handleTap);
        chartArea.addEventListener('touchend', handleTap);

        return () => {
            chartArea.removeEventListener('click', handleTap);
            chartArea.removeEventListener('touchend', handleTap);

        };
    }, []);

    const getElementClass = () => {
        let badge = 'text-xs font-medium me-2 px-2.5 py-0.5 rounded'
        switch (screenTapValue) {
            case 1:
                badge += ' bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                break;
            case 2:
                badge += ' bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                break;
            default:
                badge += ' bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                break;
        }
        return badge
    }


    return (
        <div className="p-2 bg-opacity-10 bg-gray-100 w-full rounded my-1.5">
            <div className="flex items-center justify-between w-full p-2 rounded bg-opacity-10 bg-gray-100">
                <h1 className="text-base italic font-medium text-gray-400 text-center">Trade View</h1>
                <span className={getElementClass()}>{BADGES_LABEL[screenTapValue]}</span>
            </div>
        </div>
    )
}

export default ChartLabelComponent
