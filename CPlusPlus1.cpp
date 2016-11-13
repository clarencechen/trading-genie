#include <emscripten/bind.h>

using namespace emscripten;

void getInputArr(uintptr_t Price, int index);
void combine(double* Price, int index);
void setLen(const int ArrLen);
uintptr_t SMAlow(int size1);
uintptr_t SMAhigh(int size2);
int Net(int size1);
uintptr_t Optimal(int size2, int size1);
void delArr();

double* High;
double* Low;
double* data;
int* optimal;


EMSCRIPTEN_BINDINGS(raw_pointers)
{
	function("Net", &Net);
	function("SMAhigh", &SMAhigh, allow_raw_pointers());
	function("SMAlow", &SMAlow, allow_raw_pointers());
    function("Optimal", &Optimal, allow_raw_pointers());
    function("getInputArr", &getInputArr, allow_raw_pointers());
    function("setLen", &setLen, allow_raw_pointers());
    function("delArr", &delArr, allow_raw_pointers());

}


void getInputArr(uintptr_t Price, int index)
{
	combine(reinterpret_cast<double*>(Price),index);
}

void combine(double* Price, int index)
{
	for(int i = 0; i < 100; i++)
		data[(index*100) + i + 1] = Price[i];
}

void setLen(const int ArrLen)
{
	data = new double[ArrLen + 1];
	High = new double[ArrLen+ 1];
    Low = new double[ArrLen + 1];
	data[0] = (double)ArrLen;
	High[0] = (double)ArrLen;
	Low[0] = (double)ArrLen;
}
uintptr_t SMAlow(int size1)
{
	double sum;
	for (int i = 1; i <= Low[0]; i ++)
	{
		if (i <= size1)
		{
			Low[i] = 0.0;
			continue;
		}
		sum = 0;
		for(int j = i - size1 +1; j <= i; j ++)
		{
			sum += data[j];
		}
		Low[i] = sum/(double)(size1);
	}
	return reinterpret_cast<uintptr_t>(Low);//emscripten does not support returning pointers
}
uintptr_t SMAhigh(int size2)
{
	double sum;
	for (int i = 1; i <= High[0]; i ++)
	{
		if (i <= size2)
		{
			High[i] = 0.0;
			continue;
		}
		sum = 0;
		for(int j = i - size2 +1; j <= i; j ++)
		{
			sum += data[j];
		}
		High[i] = sum/(double)(size2);
	}
	return reinterpret_cast<uintptr_t>(High);//emscripten does not support returning pointers
}
int Net(int size1)
{
	int dataPoints = data[0];
	int bought_and_sold = 0;
	double boughtAt;
	double soldAt;
	double totalProfit = 0;
	for (int i = size1 + 2; i <= dataPoints; i++)
	{
		//if slow moving average crosses over fastmovingaverage
		if (Low[i] > High[i])
		{
			if(Low[i-1] < High[i-1])
			{
				//cout << "Buy at this time : " << i << endl;
				bought_and_sold++;
				boughtAt = data[i];
			}
		}
		//if fast moving average crosses over slowmoving average
		if (Low[i] < High[i])
		{
			if(Low[i-1] > High[i-1])
			{
				if (bought_and_sold == 1) //need to buy before selling
				{
					//cout << "Sell at this time : " << i << endl;
					bought_and_sold++;
					soldAt = data[i];
				}
			}
		}
		if (bought_and_sold == 2)
		{
			bought_and_sold = 0;
			double profit = (double)(soldAt - boughtAt);
			totalProfit += profit;
		}
	}
	return (int)(totalProfit);
}
uintptr_t Optimal(int size2, int size1)
{
	int maximum = 0;
	const int dataPoints = data[0];
	int optimalBar;
	double* FMA = new double[dataPoints];

	//FMA = Plot(data, fastBar,dataPoints);

	for (int i = 2; i < size1; i ++)
	{
		FMA = reinterpret_cast<double*>(SMAhigh(i));
		High = FMA;
		int temp = Net(i);

		if (temp > maximum)
		{
			maximum = temp;
			optimalBar = i;
		}
	}

	optimal = new int[2];
	optimal[0] = maximum;
	optimal[1] = optimalBar;
	delete[] FMA;
	//delete[] SMA;
	return reinterpret_cast<uintptr_t>(optimal);//emscripten does not support returning pointers
}
void delArr()
{
	delete[] optimal;
	delete[] High;
	delete[] Low;
	delete[] data;
}
//void myFunc(uintptr_t bufAddr, unsigned int size)
//{
//  origFunc(reinterpret_cast<double*>(bufAddr), size);
//}
