#include <emscripten/bind.h>

using namespace emscripten;

void getInputArr(double* Price, int index);
void combine(double* Price, int index);
void setLen(const int ArrLen);
double* SMAlow(int size1);
double* SMAhigh(int size2);
int Net(int size1);
int* Optimal(int size2, int size1);
void delArr();

double* High;
double* Low;
double* data;
double* optimal;


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


void getInputArr(double* Price, int index)
{
	combine(Price,index);
}

void combine(double* Price, int index)
{
	for(int i = 0; i < 100; i++)
		data[(index*100) + i + 1] = Price[i];
}

void setLen(const int ArrLen)
{
	double* data = new double[ArrLen + 1];
	data[0] = ArrLen;
}
double* SMAlow(int size1)
{
	int length = data[0];
	double* Low = new double[length + 1];
	double sum;

	for (int i = 0; i < length; i ++)
	{
		if (i < size1)
		{
			Low[i] = 0.0;
			continue;
		}
		sum = 0;
		for(int j = i - size1; j < i; j ++)
		{
			sum += data[j];
		}
		Low[i] = sum/(double)(size1);
	}
	return Low;
}
double* SMAhigh(int size2)
{
	int length = data[0];
	double* High = new double[length + 1];
	double sum;

	for (int i = 0; i < length; i ++)
	{
		if (i < size2)
		{
			High[i] = 0.0;
			continue;
		}
		sum = 0;
		for(int j = i - size2; j < i; j ++)
		{
			sum += data[j];
		}
		High[i] = sum/(double)(size2);
	}
	return High;
}
int Net(int size1)
{
	int dataPoints = data[0];
	int bought_and_sold = 0;
	double boughtAt;
	double soldAt;
	double totalProfit = 0;
	for (int i = size1 + 1; i < dataPoints; i++)
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
int* Optimal(int size2,int size1)
{
	int maximum = 0;
	int dataPoints = data[0];
	int optimalBar;
	//double* FMA = new double[dataPoints];
	double* FMA = new double[dataPoints];

	//FMA = Plot(data, fastBar,dataPoints);

	for (int i = 2; i < size1; i ++)
	{
		FMA = SMAhigh(i);
		High = FMA;
		int temp = Net(size1);

		if (temp > maximum)
		{
			maximum = temp;
			optimalBar = i;
		}
	}

	int* optimal = new int[2];
	optimal[0] = maximum;
	optimal[1] = optimalBar;
	delete[] FMA;
	//delete[] SMA;
	return optimal;
}
void delArr()
{
	delete[] High;
	delete[] Low;
	delete[] data;
	delete[] optimal;
}
//void myFunc(uintptr_t bufAddr, unsigned int size)
//{
//  origFunc(reinterpret_cast<double*>(bufAddr), size);
//}
